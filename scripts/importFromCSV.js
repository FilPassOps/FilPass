const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const { encryptPII } = require('../lib/emissaryCrypto')
const { newPrismaTransaction, getPrismaClient } = require('../lib/prisma')
const { parse } = require('csv-parse/sync')
const { TransactionError } = require('../lib/errors')
const fs = require('fs')
const { generateEmailHash } = require('lib/password')
const { validateWalletAddress } = require('lib/filecoinShipyard')

async function run() {
  const [filePath] = process.argv.slice(2)

  if (!filePath) {
    throw new Error('Please provide a file path')
  }

  const fileData = fs.readFileSync(filePath, 'utf8')
  const records = parse(fileData, {
    columns: true,
    skip_empty_lines: true,
    delimiter: [',', ';'],
  })

  const { users, error: usersError } = await prismaCreateUser(records)

  if (usersError) {
    console.error({ error: usersError })
  }

  const { data, error: walletError } = await prismaCreateUserWallet(records, users)

  if (walletError) {
    console.error({ error: walletError })
  }

  console.log(data)
  return
}

async function prismaCreateUser(records) {
  const prismaClient = await getPrismaClient()

  let users = await prismaClient.user.findMany({ where: { isActive: true } })

  const newUsers = records.reduce((emailList, singleRecord) => {
    const foundUser = users.find(({ email }) => email === singleRecord.Email)
    if (!foundUser) {
      const alreadyAdded = emailList.find(email => email === singleRecord.Email)

      if (!alreadyAdded) {
        emailList.push(singleRecord.Email)
      }
    }

    return emailList
  }, [])

  if (!newUsers.length) {
    return { users }
  }

  const { data = [], error } = await newPrismaTransaction(async prisma => {
    const createUserPromiseList = newUsers.map(async userEmail => {
      try {
        const newUser = await prisma.user.create({
          data: {
            email: await encryptPII(userEmail),
            emailHash: await generateEmailHash(userEmail),
            isVerified: true,
            roles: {
              create: [
                {
                  role: 'USER',
                },
              ],
            },
          },
        })

        newUser.email = userEmail

        return newUser
      } catch (error) {
        return { error }
      }
    })

    const createdUsers = await Promise.allSettled(createUserPromiseList)
    const values = createdUsers.map(({ value }) => value)
    if (values.filter(users => users.error).length) {
      throw new TransactionError('Error while creating users', { status: 500 })
    }
    return values
  })
  return { users: [...users, ...data], error }
}

async function prismaCreateUserWallet(records, users) {
  return await newPrismaTransaction(async prisma => {
    const promiseList = records.map(async (singleRecord, index) => {
      try {
        await validateWalletAddress(singleRecord['FIL Address'])
      } catch (error) {
        throw { message: 'INVALID WALLET', index }
      }

      const requestUser = users.find(singleUser => singleUser.email === singleRecord.Email)
      const wallets = await prisma.userWallet.findMany({
        where: {
          userId: requestUser.id,
          isActive: true,
        },
      })

      const hasDefaultWallet = wallets.find(({ isDefault }) => isDefault)

      if (hasDefaultWallet) {
        return { error: { wallet: 'USER ALREADY HAS DEFAULT WALLET', index } }
      }

      const storedWallet = wallets.find(({ address }) => address === singleRecord['FIL Address'])

      if (storedWallet) {
        return { ...requestUser, wallet: storedWallet }
      }

      const verification = await prisma.walletVerification.create({
        data: {
          userId: requestUser.id,
          isVerified: true,
          isActive: true,
          blockchain: 'FILECOIN',
          address: singleRecord['FIL Address'],
          transactionContent: {},
          transactionId: '',
          transactionAmount: 0,
        },
      })

      const newWallet = await prisma.userWallet.create({
        data: {
          userId: requestUser.id,
          name: 'Imported by the finance team',
          address: singleRecord['FIL Address'],
          blockchain: 'FILECOIN',
          isDefault: true,
          verificationId: verification.id,
        },
      })

      return { ...requestUser, wallet: newWallet }
    })

    const createdWallets = await Promise.allSettled(promiseList)

    if (createdWallets.filter(result => result.status === 'rejected').length) {
      const requests = createdWallets.map(result => (result.status === 'rejected' ? result.reason : {}))

      if (requests.some(({ wallet }) => wallet)) {
        throw new Error(JSON.stringify(requests))
      }

      throw new TransactionError('Error while creating wallets', { status: 500 })
    }

    return createdWallets.map(({ value }) => value)
  })
}

run()

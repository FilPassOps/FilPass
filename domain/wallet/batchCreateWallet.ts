import { TransactionError } from 'lib/errors'
import { matchWalletAddress } from 'lib/filecoinShipyard'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import _ from 'lodash'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { getDelegatedAddress } from 'lib/getDelegatedAddress'
import { Prisma } from '@prisma/client'

interface Request {
  wallet: {
    created?: boolean
    isDefault: boolean
    address: string
  }
  receiver: {
    id: number
    email: string
  }
  receiverEmail: string
  skipWalletCreation: boolean
  row: number
}

interface BatchCreateWalletParams {
  requests: {
    receiverEmail: string
    wallet?: string
    skipWalletCreation?: boolean
  }[]
  users: {
    id: number
    email: string
  }[]
  isBatchCsv?: boolean
}

interface CheckWalletParams {
  prisma: Prisma.TransactionClient
  user: { id: number; email: string }
  request: BatchCreateWalletParams['requests'][0]
  isBatchCsv?: boolean
  index: number
}

export const batchCreateWallet = async ({ requests, users, isBatchCsv }: BatchCreateWalletParams) => {
  const validatePromiseList = requests.map(async (singleRequest, index) => {
    const user = users.find(singleUser => singleUser.email === singleRequest.receiverEmail)

    if (!user) {
      throw { message: `${errorsMessages.user_not_found.message} At line ${index + 1}` }
    }

    return await checkWallet({ prisma, user, request: singleRequest, isBatchCsv, index })
  })

  const validatedWallets = await Promise.allSettled(validatePromiseList)

  const walletRequests = validatedWallets.map(result => (result.status === 'rejected' ? result.reason : result.value))
  const foundRejected = validatedWallets.find(req => req.status === 'rejected')

  if (foundRejected) {
    const errors = validatedWallets.map(result =>
      result.status === 'rejected' ? { wallet: { message: result.reason?.message ?? errorsMessages.wallet_incorrect.message } } : null,
    )
    return {
      error: {
        status: 400,
        errors: errors,
      },
    }
  }

  const { data: createdWallets, error } = await createWallets(walletRequests)

  if (error) {
    return { error }
  }

  return await setDefaultWallets(createdWallets as Request[])
}

const checkWallet = async ({ prisma, user, request, isBatchCsv, index }: CheckWalletParams) => {
  const userWallets = await prisma.userWallet.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
  })

  const defaultWallet = userWallets.find(wallet => wallet.isDefault)

  if (defaultWallet && !request.wallet) {
    return { ...request, wallet: defaultWallet, receiver: user }
  }

  if (!defaultWallet && !request.wallet && isBatchCsv) {
    throw { message: `${errorsMessages.default_wallet_not_found.message} At line ${index + 1}` }
  }

  if (!defaultWallet && !request.wallet && !isBatchCsv) {
    throw { wallet: errorsMessages.default_wallet_not_found }
  }

  const storedWallet = userWallets.find(({ address }) => address === request.wallet)

  if (storedWallet) {
    return {
      ...request,
      wallet: storedWallet,
      receiver: user,
    }
  }

  if (!storedWallet && !request.wallet) {
    throw { wallet: errorsMessages.wallet_cant_be_empty }
  }

  if (request.wallet?.startsWith('0x')) {
    const delegatedAddress = getDelegatedAddress(request.wallet).fullAddress

    if (!delegatedAddress) {
      throw { wallet: errorsMessages.wallet_incorrect }
    }

    request.wallet = request.wallet.toLowerCase()
  } else {
    const isWalletValid = await matchWalletAddress(request.wallet as string)

    if (!isWalletValid) {
      throw { wallet: errorsMessages.wallet_not_found }
    }
  }

  return {
    ...request,
    wallet: { created: false, isDefault: false, address: request.wallet },
    receiver: user,
  }
}

const createWallets = async (requests: Request[]) => {
  return await newPrismaTransaction(async prisma => {
    const promiseList = requests.map(async singleRequest => {
      if (singleRequest.wallet?.created === false && !singleRequest?.skipWalletCreation) {
        const wallet = await prisma.userWallet.create({
          data: {
            userId: singleRequest.receiver.id,
            name: 'created by approver',
            address: singleRequest.wallet.address,
            blockchain: 'FILECOIN',
            isDefault: false,
          },
        })

        return { ...singleRequest, wallet }
      }

      return singleRequest
    })

    const createdWallets = await Promise.allSettled(promiseList)

    const walletRequests = createdWallets.map(result => (result.status === 'rejected' ? result : result.value))

    const foundRejected = createdWallets.find(req => req.status === 'rejected')

    if (foundRejected) {
      if ((foundRejected as PromiseRejectedResult).reason.code === 'P2002') {
        throw new TransactionError(
          'Please update the file so you are only adding 1 wallet per user. If you are adding multiple requests for 1 user, add the wallet to the first request and keep wallet on other requests blank.',
          { status: 400, errors: undefined },
        )
      }
      throw new TransactionError('Error while creating wallets', { status: 500, errors: undefined })
    }

    return cleanRequests(walletRequests as Request[])
  })
}

const setDefaultWallets = async (requests: Request[]) => {
  return await newPrismaTransaction(async prisma => {
    const promiseList = requests.map(async singleRequest => {
      if (singleRequest.wallet.isDefault) {
        return singleRequest
      }

      const userWallets = await prisma.userWallet.findMany({
        where: {
          userId: singleRequest.receiver.id,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const defaultWallet = userWallets.find(wallet => wallet.isDefault)

      const isEthereumWallet =
        userWallets[0].address.startsWith('0x') || userWallets[0].address.startsWith('f4') || userWallets[0].address.startsWith('t4')

      if (!defaultWallet && !isEthereumWallet) {
        await prisma.userWallet.update({
          where: {
            id: userWallets[0].id,
          },
          data: {
            isDefault: true,
          },
        })
      }

      return singleRequest
    })

    const updatedWallets = await Promise.allSettled(promiseList)

    const walletRequests = updatedWallets.map(result => (result.status === 'rejected' ? result : result.value))

    if (updatedWallets.find(req => req.status === 'rejected')) {
      throw new TransactionError('Error while updating default wallet', { status: 500, errors: undefined })
    }

    return walletRequests
  })
}

const cleanRequests = (requests: Request[]) => {
  const uniqueWalletsAndEmails = _.mapValues(_.groupBy(requests, 'wallet.address'), value => _.uniqBy(value, 'receiverEmail'))
  const uniqueRequests = _.flatMap(uniqueWalletsAndEmails, (value, key) => value.map(v => ({ ...v, wallet: key })))

  return requests.map(request => {
    if (!uniqueRequests.find(r => r.row === request.row)) {
      const createdWallet = requests.find(r => r.wallet.address === request.wallet.address && r.receiverEmail === request.receiverEmail)
        ?.wallet
      return { ...request, wallet: createdWallet }
    } else {
      return request
    }
  })
}

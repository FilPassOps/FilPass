import { Prisma } from '@prisma/client'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import { validateWalletAddress } from 'lib/blockchain-utils'
import { generateEmailHash } from 'lib/password'
import prisma from 'lib/prisma'
import yup, { validate } from 'lib/yup'
import { sortedUniq } from 'lodash'
import { csvSchemaV1, csvSchemaV2, uploadBatchCsvValidator } from './validation'

interface UploadBatchCsvParams {
  programId: number
  approverId: number
  file: {
    fieldname: string
    originalname: string
    encoding: string
    mimetype: string
    destination: string
    filename: string
    path: string
    size: number
  }
}

interface VerifyCsvParams {
  file: UploadBatchCsvParams['file']
  prisma: Prisma.TransactionClient
  approverId: number
  blockchainName: string
  chainId: string
}

interface Row {
  Amount: number
  Email: string
  [key: string]: any
}

export async function uploadBatchCsv(params: UploadBatchCsvParams) {
  const { fields, errors } = await validate(uploadBatchCsvValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { file, approverId, programId } = fields

  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: {
      currency: {
        select: {
          blockchain: {
            select: {
              name: true,
              chainId: true,
            },
          },
        },
      },
    },
  })

  const verifyResult = await verifyCsv({
    file,
    prisma,
    approverId,
    blockchainName: program?.currency?.blockchain?.name as string,
    chainId: program?.currency?.blockchain?.chainId as string,
  })

  if (verifyResult.errors.length > 0) {
    return {
      error: {
        status: 400,
        errors: verifyResult.errors,
      },
    }
  }

  return {
    data: { requests: verifyResult.data, file: { ...file, data: verifyResult.file }, hasCustodian: verifyResult.hasCustodian },
  }
}

const verifyCsv = async ({ file, prisma, approverId, blockchainName, chainId }: VerifyCsvParams) => {
  const fileData = fs.readFileSync(file.path, 'utf8')
  let records
  try {
    records = parse(fileData, {
      columns: true,
      skip_empty_lines: true,
      delimiter: [',', ';'],
    })
  } catch (error) {
    const errors = [{ message: 'CSV is not formatted correctly.' }]
    return { errors, data: records, file: fileData, hasCustodian: undefined }
  }

  if (records.length === 0) {
    const errors = [{ message: 'No data found in CSV file.' }]
    return { errors, data: records, file: fileData, hasCustodian: undefined }
  }

  if (records.length > 500) {
    const errors = [{ message: 'Error: 500+ detected. Maximum = 500 entries.' }]
    return { errors, data: records, file: fileData, hasCustodian: undefined }
  }

  const validationObject = {
    records,
    prisma,
    fileData,
    blockchainName,
    chainId,
  }

  const isV2 = csvSchemaV2.isValidSync(records[0])
  if (isV2) {
    return await validateV2SchemaFile(validationObject, approverId)
  }

  const isV1 = csvSchemaV1.isValidSync(records[0])
  if (isV1) {
    return { ...(await validateV1SchemaFile(validationObject)), hasCustodian: undefined }
  }

  const errors = [{ message: 'Unknown CSV template' }]
  return { errors, data: records, file: fileData, hasCustodian: undefined }
}

const validateV1SchemaFile = async (validationObject: {
  records: any
  prisma: Prisma.TransactionClient
  fileData: string
  blockchainName: string
  chainId: string
}) => {
  const { records, prisma, fileData, blockchainName, chainId } = validationObject
  const errors: any[] = []

  const { error: verifyEmailErrors } = verifyEmail(records)
  if (verifyEmailErrors) {
    verifyEmailErrors.forEach(error => errors.push(error))
  }

  const { error: amountErrors } = verifyAmount(records)
  if (amountErrors) {
    amountErrors.forEach(error => errors.push(error))
  }

  const { error: walletErrors } = await verifyWallet(records, prisma, blockchainName, chainId, 'Wallet Address')
  if (walletErrors) {
    walletErrors.forEach(error => errors.push(error))
  }

  return { errors, data: records, file: fileData }
}

const validateV2SchemaFile = async (
  validationObject: { records: any; prisma: Prisma.TransactionClient; fileData: string; blockchainName: string; chainId: string },
  approverId: number,
) => {
  const { records, prisma, fileData, blockchainName, chainId } = validationObject

  const errors: any = []

  const { error: verifyEmailErrors } = verifyEmail(records)
  if (verifyEmailErrors) {
    verifyEmailErrors.forEach(error => errors.push(error))
  }

  const { error: amountErrors } = verifyAmount(records)
  if (amountErrors) {
    amountErrors.forEach(error => errors.push(error))
  }

  const { error: walletErrors } = await verifyWallet(records, prisma, blockchainName, chainId, 'Addresses')
  if (walletErrors) {
    walletErrors.forEach(error => errors.push(error))
  }

  const { error: approvalErrors } = verifyApprovalForTransfer(records)
  if (approvalErrors) {
    approvalErrors.forEach(error => errors.push(error))
  }

  const { error: custodianlErrors, hasCustodian } = await verifyCustodian(records, approverId, prisma)

  if (custodianlErrors.length) {
    custodianlErrors.forEach(error => errors.push(error))
  }

  return { errors, data: records, file: fileData, hasCustodian }
}

const verifyAmount = (data: any[]) => {
  const errors = []

  const amounts = data.map((row, index) => ({ amount: row.Amount, row: index + 2 }))

  const invalidAmounts = amounts.filter(({ amount }) => !yup.number().moreThan(0).isValidSync(amount))
  const requiredAmounts = amounts.filter(({ amount }) => !yup.number().required().isValidSync(amount))

  if (invalidAmounts.length > 0) {
    const pluralInvalidAmounts = invalidAmounts.length > 1 ? 's' : ''
    errors.push({
      message: `Invalid amount${pluralInvalidAmounts} detected in row${pluralInvalidAmounts} ${invalidAmounts
        .map(amount => amount.row)
        .join(', ')}. Amount must be a number greater than 0.`,
    })
  }

  if (requiredAmounts.length > 0) {
    const pluralRequiredAmounts = requiredAmounts.length > 1 ? 's' : ''
    errors.push({
      message: `Required amount${pluralRequiredAmounts} missing in row${pluralRequiredAmounts} ${requiredAmounts
        .map(amount => amount.row)
        .join(', ')}. Amount is required.`,
    })
  }

  return { error: errors.length > 0 ? errors : null }
}

const verifyEmail = (data: Row[]) => {
  const errors: any[] = []
  const emails = data.map((row, index) => ({ email: row.Email, row: index + 2 }))
  const invalidEmails = emails.filter(email => !yup.string().email().isValidSync(email.email))
  const requiredEmails = emails.filter(email => !yup.string().email().required().isValidSync(email.email))

  if (invalidEmails.length > 0) {
    const pluralInvalidEmails = invalidEmails.length > 1 ? 's' : ''
    errors.push({
      message: `Invalid email${pluralInvalidEmails} found on row${pluralInvalidEmails} ${invalidEmails.map(email => email.row).join(', ')}`,
    })
  }

  if (requiredEmails.length > 0) {
    const pluralRequiredEmails = requiredEmails.length > 1 ? 's' : ''
    errors.push({
      message: `Missing email${pluralRequiredEmails} on row${pluralRequiredEmails} ${invalidEmails.map(email => email.row).join(', ')}`,
    })
  }

  return { error: errors.length > 0 ? errors : null }
}

const verifyWallet = async (data: Row[], prisma: Prisma.TransactionClient, blockchainName: string, chainId: string, propName: string) => {
  const errors: any[] = []

  const walletsWithEmails = await Promise.all(
    data.map(async (row, index) => ({
      wallet: row[propName],
      email: await generateEmailHash(row['Email']),
      row: index + 2,
    })),
  )

  const emailsArray = walletsWithEmails.map(({ email }) => email)

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      emailHash: { in: emailsArray },
    },
    select: {
      email: true,
      emailHash: true,
      id: true,
      wallets: {
        select: {
          id: true,
          address: true,
          isDefault: true,
          blockchain: {
            select: {
              chainId: true,
            },
          },
        },
      },
    },
  })

  await Promise.all(
    walletsWithEmails.map(async ({ wallet, email, row }) => {
      if (!wallet) {
        const userWithDefaultWallet = users.find(
          user => user.emailHash === email && user.wallets.some(wallet => wallet.isDefault && wallet.blockchain.chainId === chainId),
        )

        if (!userWithDefaultWallet) {
          errors.push({ message: `No wallet or default wallet found on row ${row}` })
        }
        return {
          wallet: userWithDefaultWallet?.wallets?.[0],
          email: userWithDefaultWallet?.email,
        }
      }

      if (wallet && !validateWalletAddress(wallet)) {
        errors.push({ message: `Invalid wallet address on row ${row}. The wallet is not a valid ${blockchainName} address.` })
      }
    }),
  )

  return { error: errors.length > 0 ? errors : null }
}

const verifyApprovalForTransfer = (records: Row[]) => {
  const errors: any[] = []
  records.forEach((row, index) => {
    const approval = row['ApprovalForTransfer']
    if (approval?.toLowerCase() !== 'true') {
      errors.push({ message: `Not approved for transfer on row ${index + 2}` })
    }
  })
  return { error: errors.length > 0 ? errors : null }
}

const verifyCustodian = async (records: Row[], approverId: number, prisma: Prisma.TransactionClient) => {
  const returnValue = { error: [] as any[], hasCustodian: false }

  const allPrograms = sortedUniq(records.map(row => row['Custodian']))
  const programs = await prisma.program.findMany({
    where: { name: { in: allPrograms }, isActive: true, isArchived: false },
    select: {
      id: true,
      name: true,
      userRolePrograms: {
        select: {
          userRoleId: true,
          isActive: true,
        },
      },
    },
  })

  await Promise.allSettled(
    records.map(async (row, index) => {
      const custodian = row['Custodian']

      if (custodian) {
        const program = programs.find(({ name }) => name.trim().toLowerCase() === custodian.trim().toLowerCase())

        if (!program) {
          returnValue.error.push({ message: `Custodian on line ${index + 2} does not exist` })
          return
        }

        if (!program.userRolePrograms.find(({ userRoleId, isActive }) => userRoleId === approverId && isActive === true)) {
          returnValue.error.push({ message: `Not an approver for Custodian on line ${index + 2}` })
          return
        }

        row.programId = program.id
        returnValue.hasCustodian = true
        return
      }

      returnValue.error.push({ message: `Custodian not defined on line ${index + 2}` })
    }),
  )

  return returnValue
}

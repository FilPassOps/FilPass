import { Role } from '@prisma/client'
import { createTransferRequestSubmittedFormValidator } from 'domain/transferRequestDraft/validation'
import { batchCreateWallet } from 'domain/wallet/batchCreateWallet'
import { encrypt, encryptPII } from 'lib/emissaryCrypto'
import { TransactionError } from 'lib/errors'
import { moveFileS3 } from 'lib/fileUpload'
import { logger } from 'lib/logger'
import { generateEmailHash, generateTeamHash } from 'lib/password'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { DateTime } from 'luxon'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { SUBMITTED_BY_APPROVER_STATUS } from './constants'

interface BatchCreateTransferRequestParams {
  approverRoleId?: number
  requesterId?: number
  isBatchCsv: boolean
  requests: {
    receiverEmail: string
    programId: number
    team: string
    amount: string
    temporaryFileId?: string
    currencyUnitId: number
    wallet?: string
    skipWalletCreation?: boolean
  }[]
}

interface CompletedRequest extends BatchCreateTransferRequestParams {
  receiverEmail: string
  programId: number
  team: string
  amount: string
  temporaryFileId?: string
  currencyUnitId: number
  skipWalletCreation?: boolean
  receiver: {
    id: string
    terms: string
  }
  wallet: {
    id: number
    address: string
  }
}

type Requests = BatchCreateTransferRequestParams['requests']

export async function batchCreateTransferRequest(params: BatchCreateTransferRequestParams) {
  const { fields, errors } = await validate(createTransferRequestSubmittedFormValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { requests, approverRoleId, requesterId, isBatchCsv } = fields

  const { users, error: usersError } = await prismaCreateUser(requests)

  if (usersError) {
    return { error: usersError }
  }

  const { data: completeRequests, error: walletError } = (await batchCreateWallet({ requests, users, isBatchCsv })) as {
    data: CompletedRequest[]
    error: any
  }

  if (walletError) {
    return { error: walletError }
  }

  const { data, error: transferRequesterror } = await prismaCreateTransferRequest(
    completeRequests,
    requesterId as number,
    approverRoleId as number,
  )
  if (transferRequesterror) {
    return { error: transferRequesterror }
  }

  return { data }
}

export async function prismaCreateUser(requests: Requests) {
  const emailHashes = await Promise.all(requests.map(async request => generateEmailHash(request.receiverEmail)))

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      emailHash: { in: emailHashes },
    },
  })

  const newUsers = requests.reduce((emailList, singleTransferRequest) => {
    const foundUser = users.find(({ email }) => email === singleTransferRequest.receiverEmail)
    if (!foundUser) {
      const alreadyAdded = emailList.find(email => email === singleTransferRequest.receiverEmail)

      if (!alreadyAdded) {
        emailList.push(singleTransferRequest.receiverEmail)
      }
    }

    return emailList
  }, [] as string[])

  if (!newUsers.length) {
    return { users }
  }

  const { data = [], error } = (await newPrismaTransaction(async prisma => {
    const createUserPromiseList = newUsers.map(async userEmail => {
      const newUser = await prisma.user.create({
        data: {
          email: await encryptPII(userEmail),
          emailHash: await generateEmailHash(userEmail),
          isVerified: true,
          roles: {
            createMany: {
              data: [{ role: Role.USER }],
            },
          },
        },
      })

      newUser.email = userEmail

      return newUser
    })

    const createdUsers = await Promise.allSettled(createUserPromiseList)

    const values = createdUsers.map(result => {
      if (result.status === 'rejected') {
        logger.error('Error while creating users', createdUsers)
        throw new TransactionError('Error while creating users', { status: 500, errors: undefined })
      } else {
        return result.value
      }
    })
    return values
  })) as { data: any[]; error: any }
  return { users: [...users, ...data], error }
}

export async function prismaCreateTransferRequest(requests: CompletedRequest[], requesterId: number, approverRoleId: number) {
  const { data, error } = await buildTransferRequestData(requests, requesterId, approverRoleId)

  if (error) {
    return error
  }

  return await newPrismaTransaction(async prisma => {
    const addressesToLog = []
    const promiseList = data.map(async ({ userWalletAddress, ...singleRequest }) => {
      const createdTransferRequest = await prisma.transferRequest.create({
        data: singleRequest,
      })
      addressesToLog.push({ requestId: createdTransferRequest.publicId, oldAddress: '-', newAddress: userWalletAddress })
      return createdTransferRequest
    })

    const createdTransferRequests = await Promise.allSettled(promiseList)

    const requests = createdTransferRequests.map(result => {
      if (result.status === 'rejected') {
        logger.error('Error while creating transfer request', result)
        throw new TransactionError('Error while creating transfer request', { status: 500, errors: undefined })
      } else {
        return result.value
      }
    })

    return requests
  })
}

export async function buildTransferRequestData(requests: CompletedRequest[], requesterId: number, approverRoleId: number) {
  const programs = await prisma.userRoleProgram.findMany({
    where: {
      userRoleId: approverRoleId,
      userRole: {
        role: {
          equals: 'APPROVER',
        },
      },
    },
    include: {
      program: true,
    },
  })

  const promiseList = requests.map(async (singleRequest, index) => {
    const userRoleProgram = programs.find(program => program.programId === singleRequest.programId)

    if (!userRoleProgram) {
      throw { message: errorsMessages.program_not_found, field: 'programId' }
    }

    let attachment
    if (singleRequest.temporaryFileId) {
      const tempFile = await prisma.temporaryFile.findUnique({
        where: {
          publicId: singleRequest.temporaryFileId,
        },
      })

      if (!tempFile) {
        throw { message: errorsMessages.something_went_wrong }
      }

      const { data: file, error } = await moveFileS3({ userId: singleRequest.receiver.id, type: tempFile.type, source: tempFile.key })

      if (error) {
        throw { message: errorsMessages.something_went_wrong }
      }

      attachment = await prisma.userFile.create({
        data: {
          userId: Number(singleRequest.receiver.id),
          uploaderId: tempFile.uploaderId,
          key: file.key,
          filename: tempFile.filename,
          type: tempFile.type,
          isActive: tempFile.isActive,
        },
      })
    }

    const { receiver } = singleRequest

    return {
      requesterId,
      programId: singleRequest.programId,
      userWalletId: singleRequest.wallet.id,
      userWalletAddress: singleRequest.wallet.address,
      attachmentId: attachment?.id,
      receiverId: receiver.id,
      team: (singleRequest.team && (await encryptPII(singleRequest.team))) || '',
      teamHash: (singleRequest.team && (await generateTeamHash(singleRequest.team))) || '',
      amount: (singleRequest.amount && (await encrypt(singleRequest.amount))) || '',
      status: SUBMITTED_BY_APPROVER_STATUS,
      currencyUnitId: singleRequest.currencyUnitId,
      terms: receiver?.terms ?? undefined,
      expectedTransferDate: DateTime.now().plus({ days: 30 }).toISO(),
    }
  })

  const data = await Promise.allSettled(promiseList)

  const errors: any[] = []
  const finalData: any[] = []

  data.forEach(({ status, value, reason }: any) => {
    if (status === 'rejected') {
      if (reason?.field) {
        errors.push({ [reason.field]: { message: reason?.message ?? 'Incorrect field' } })
      } else {
        // TODO: do something if it is a generic error
      }
    } else {
      finalData.push(value)
    }
  })

  if (errors.length) {
    throw { status: 400, errors }
  }

  return { data: finalData, error: null }
}

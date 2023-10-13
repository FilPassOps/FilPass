import { Role } from '@prisma/client'
import { sendCreatedDraftNotification } from 'domain/notifications/send-created-draft-notification'
import { createTransferRequestDraftValidator } from 'domain/transfer-request-draft/validation'
import { encrypt, encryptPII } from 'lib/emissary-crypto'
import { TransactionError } from 'lib/errors'
import { moveFileS3 } from 'lib/file-upload'
import { logger } from 'lib/logger'
import { generateEmailHash, generateTeamHash } from 'lib/password'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface CreateTransferRequestDraftParams {
  approverRoleId: number
  requesterId: number
  requests: {
    receiverEmail: string
    programId: number
    team?: string
    amount?: string
    temporaryFileId?: string
    currencyUnitId: number
  }[]
}

interface BuildTransferRequestDraftDataParams {
  users: {
    id: number
    email: string
    isDraft: boolean
  }[]
  requests: {
    receiverEmail: string
    programId: number
    team?: string
    amount?: string
    temporaryFileId?: string
    currencyUnitId: number
  }[]
  approverRoleId: number
  requesterId: number
}

interface PrismaCreateTransferRequestDraftParams {
  draft: {
    requesterId: number
    receiverId: number
    currencyUnitId: number
    attachmentId?: number
    programId: number
    team: string
    teamHash: string
    amount: string
  }
  rawDraft: {
    receiverEmail: string
    programId: number
    team?: string
    amount?: string
    temporaryFileId?: string
    currencyUnitId: number
  }
  user: {
    id: number
    email: string
    isDraft: boolean
  }
}

type Requests = CreateTransferRequestDraftParams['requests']

export async function createTransferRequestDraft(params: CreateTransferRequestDraftParams) {
  const { fields, errors } = await validate(createTransferRequestDraftValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { requests, approverRoleId, requesterId } = fields

  const { data: users, error: userError } = await validateAndCreateUsers(requests)

  if (userError) {
    return { error: userError }
  }

  const drafts = await buildTransferRequestDraftData({ users: users as any, requests, approverRoleId, requesterId })

  return await prismaCreateTransferRequestDraft(drafts as PrismaCreateTransferRequestDraftParams[])
}

async function validateAndCreateUsers(requests: Requests) {
  const emailHashes = await Promise.all(requests.map(async request => generateEmailHash(request.receiverEmail)))

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      emailHash: { in: emailHashes },
    },
  })

  const newUsers = requests.reduce((emailList, singleDraft) => {
    const foundUser = users.find(({ email }) => email === singleDraft.receiverEmail)
    if (!foundUser) {
      const alreadyAdded = emailList.find(email => email === singleDraft.receiverEmail)

      if (!alreadyAdded) {
        emailList.push(singleDraft.receiverEmail)
      }
    }

    return emailList
  }, [] as string[])

  const promiseList = newUsers.map(async user => ({
    encrypted: await encryptPII(user),
    raw: user,
  }))

  const encryptedEmails = await Promise.all(promiseList)

  return await newPrismaTransaction(async prisma => {
    const createUserPromiseList = encryptedEmails.map(async ({ encrypted, raw }) => {
      try {
        const newUser = await prisma.user.create({
          data: {
            email: encrypted,
            emailHash: await generateEmailHash(raw),
            isDraft: true,
            roles: {
              createMany: {
                data: [{ role: Role.USER }],
              },
            },
          },
        })

        newUser.email = raw

        return newUser
      } catch (error) {
        return { error }
      }
    })

    const createdUsers = await Promise.allSettled(createUserPromiseList)

    const values = createdUsers.map(result => {
      if (result.status === 'rejected') {
        logger.error('Error while creating user', result)
        throw new TransactionError('Error while creating users', { status: 400, errors: undefined })
      } else {
        return result.value
      }
    })

    return [...users, ...values]
  })
}

async function buildTransferRequestDraftData({ users, requests, approverRoleId, requesterId }: BuildTransferRequestDraftDataParams) {
  const programs = await prisma.userRoleProgram.findMany({
    where: {
      userRoleId: approverRoleId,
    },
  })

  if (!programs.length) {
    return {
      error: {
        message: errorsMessages.program_not_found.message,
      },
    }
  }

  const promiseList = requests.map(async singleRequest => {
    const program = programs.find(program => program.programId === singleRequest.programId)
    if (!program) {
      throw { programId: errorsMessages.program_not_found }
    }

    const user = users.find(({ email }) => email === singleRequest.receiverEmail)

    if (!user) {
      throw { receiverEmail: errorsMessages.not_found }
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

      const { data: file, error } = await moveFileS3({ userId: String(user.id), type: tempFile.type, source: tempFile.key })

      if (error) {
        throw { message: errorsMessages.something_went_wrong }
      }

      attachment = await prisma.userFile.create({
        data: {
          userId: user.id,
          uploaderId: tempFile.uploaderId,
          key: file.key,
          filename: tempFile.filename,
          type: tempFile.type,
          isActive: tempFile.isActive,
        },
      })
    }

    if (!user) {
      throw { receiverEmail: errorsMessages.not_found }
    }

    return {
      draft: {
        requesterId,
        receiverId: user.id,
        currencyUnitId: singleRequest.currencyUnitId,
        attachmentId: attachment?.id,
        programId: singleRequest.programId,
        team: (singleRequest.team && (await encryptPII(singleRequest.team))) || '',
        teamHash: (singleRequest.team && (await generateTeamHash(singleRequest.team))) || '',
        amount: (singleRequest.amount && (await encrypt(singleRequest.amount))) || '',
      },
      rawDraft: {
        ...singleRequest,
      },
      user,
    }
  })

  const data = await Promise.allSettled(promiseList)

  const finalData = data.map(result => (result.status === 'rejected' ? result : result.value))

  if (finalData.filter((req: any) => req.reason).length) {
    throw { status: 400, requests }
  }

  return finalData
}

async function prismaCreateTransferRequestDraft(draftList: PrismaCreateTransferRequestDraftParams[]) {
  return await newPrismaTransaction(async prisma => {
    const promiseList = draftList.map(async ({ draft, user, rawDraft }) => {
      const data = await prisma.transferRequestDraft.create({
        data: draft,
        include: {
          program: {
            select: {
              programCurrency: {
                select: {
                  currency: {
                    select: {
                      name: true,
                    },
                  },
                  type: true,
                },
              },
            },
          },
        },
      })

      const programCurrency = data?.program?.programCurrency
      const notification = await sendCreatedDraftNotification({
        hasAccount: !user.isDraft,
        email: user.email,
        transferRequestId: data.publicId,
        amount: rawDraft?.amount || '',
        programCurrency,
      })

      if (notification?.error) {
        throw new Error('Error sending notification')
      }

      return data
    })

    const createdDrafts = await Promise.allSettled(promiseList)

    const requests = createdDrafts.map(result => {
      if (result.status === 'rejected') {
        logger.error('Error while creating draft transfer request', result)
        throw new TransactionError('Error while creating transfer request', { status: 500, errors: undefined })
      } else {
        return result.value
      }
    })

    return requests
  })
}

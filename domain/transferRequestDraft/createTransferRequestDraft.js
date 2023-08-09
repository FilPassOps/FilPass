import { Role } from '@prisma/client'
import { sendCreatedDraftNotification } from 'domain/notifications/sendCreatedDraftNotification'
import { createTransferRequestDraftValidator } from 'domain/transferRequestDraft/validation'
import { encrypt, encryptPII } from 'lib/emissaryCrypto'
import { TransactionError } from 'lib/errors'
import { moveFileS3 } from 'lib/fileUpload'
import { generateEmailHash, generateTeamHash } from 'lib/password'
import { getPrismaClient, newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

export async function createTransferRequestDraft(params) {
  const { fields, errors } = await validate(createTransferRequestDraftValidator, params)
  if (errors) {
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

  const drafts = await buildTransferRequestDraftData(users, requests, approverRoleId, requesterId)

  return await prismaCreateTransferRequestDraft(drafts)
}

async function validateAndCreateUsers(requests) {
  const prismaClient = await getPrismaClient()

  const emailHashes = await Promise.all(requests.map(async request => generateEmailHash(request.receiverEmail)))

  let users = await prismaClient.user.findMany({
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
  }, [])

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
    const values = createdUsers.map(({ value }) => value)
    if (values.filter(users => users.error).length) {
      throw new TransactionError('Error while creating users', { status: 400 })
    }

    return [...users, ...values]
  })
}

async function buildTransferRequestDraftData(users, requests, approverRoleId, requesterId) {
  const prisma = await getPrismaClient()
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

    let attachment
    if (singleRequest.temporaryFileId) {
      const tempFile = await prisma.temporaryFile.findUnique({
        where: {
          publicId: singleRequest.temporaryFileId,
        },
      })

      const { data: file } = await moveFileS3({ userId: user.id, type: tempFile.type, source: tempFile.key })

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

  if (finalData.filter(req => req.reason).length) {
    throw { status: 400, requests }
  }

  return finalData
}

async function prismaCreateTransferRequestDraft(draftList) {
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

    if (createdDrafts.filter(result => result.status === 'rejected').length) {
      const requests = createdDrafts.map(result => (result.status === 'rejected' ? result : {}))

      if (requests.filter(req => req.reason).length) {
        throw { status: 400, requests }
      }

      throw new TransactionError('Error while creating transfer requests', { status: 500 })
    }

    return createdDrafts.map(({ value }) => value)
  })
}

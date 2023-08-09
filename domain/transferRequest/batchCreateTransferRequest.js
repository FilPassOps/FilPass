import { Role } from '@prisma/client'
import { captureException } from '@sentry/nextjs'
import { createTransferRequestSubmittedFormValidator } from 'domain/transferRequestDraft/validation'
import { findUserTaxForm } from 'domain/user'
import { batchCreateWallet } from 'domain/wallet/batchCreateWallet'
import { encrypt, encryptPII } from 'lib/emissaryCrypto'
import { TransactionError } from 'lib/errors'
import { moveFileS3 } from 'lib/fileUpload'
import { generateEmailHash, generateTeamHash } from 'lib/password'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { DateTime } from 'luxon'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { SUBMITTED_BY_APPROVER_STATUS } from './constants'

export async function batchCreateTransferRequest(params) {
  const { fields, errors } = await validate(createTransferRequestSubmittedFormValidator, params)
  if (errors) {
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

  const { data: completeRequests, error: walletError } = await batchCreateWallet(requests, users, isBatchCsv)

  if (walletError) {
    return { error: walletError }
  }

  const { data, error: transferRequesterror } = await prismaCreateTransferRequest(completeRequests, requesterId, approverRoleId)
  if (transferRequesterror) {
    return { error: transferRequesterror }
  }

  return { data }
}

export async function prismaCreateUser(requests) {
  const emailHashes = await Promise.all(requests.map(async request => generateEmailHash(request.receiverEmail)))

  let users = await prisma.user.findMany({
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
  }, [])

  if (!newUsers.length) {
    return { users }
  }

  const { data = [], error } = await newPrismaTransaction(async prisma => {
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
    const values = createdUsers.map(({ value }) => value)
    if (createdUsers.find(req => req.status === 'rejected')) {
      captureException(createdUsers)
      throw new TransactionError('Error while creating users', { status: 500 })
    }
    return values
  })
  return { users: [...users, ...data], error }
}

export async function prismaCreateTransferRequest(requests, requesterId, approverRoleId) {
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
    if (createdTransferRequests.filter(result => result.status === 'rejected').length) {
      const requests = createdTransferRequests.map(result => (result.status === 'rejected' ? result : {}))

      if (requests.find(req => req.status === 'rejected')) {
        throw { status: 400, requests }
      }
      captureException(requests)
      throw new TransactionError('Error while creating transfer requests', { status: 500 })
    }

    return createdTransferRequests.map(({ value }) => value)
  })
}

export async function buildTransferRequestData(requests, requesterId, approverRoleId) {
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

    //TODO MSIG 1 of 2
    // if (singleRequest.vestingMonths && singleRequest.vestingStartEpoch && userRoleProgram.program.deliveryMethod !== MULTISIG_1_OF_2) {
    //   throw { message: errorsMessages.program_vesting_not_supported, field: 'programId' }
    // }

    if (singleRequest.vestingMonths && (singleRequest.vestingMonths < 0 || singleRequest.vestingMonths > 200)) {
      throw { message: `${errorsMessages.invalid_vesting_months_range.message} At line ${index + 1}` }
    }

    let attachment
    if (singleRequest.temporaryFileId) {
      const tempFile = await prisma.temporaryFile.findUnique({
        where: {
          publicId: singleRequest.temporaryFileId,
        },
      })

      const { data: file } = await moveFileS3({ userId: singleRequest.receiver.id, type: tempFile.type, source: tempFile.key })

      attachment = await prisma.userFile.create({
        data: {
          userId: singleRequest.receiver.id,
          uploaderId: tempFile.uploaderId,
          key: file.key,
          filename: tempFile.filename,
          type: tempFile.type,
          isActive: tempFile.isActive,
        },
      })
    }

    const { receiver } = singleRequest

    const taxForm = await findUserTaxForm(receiver.id)

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
      firstName: (receiver.firstName && (await encryptPII(receiver.firstName))) || undefined,
      lastName: (receiver.lastName && (await encryptPII(receiver.lastName))) || undefined,
      dateOfBirth: (receiver.dateOfBirth && (await encryptPII(receiver.dateOfBirth))) || undefined,
      countryResidence: (receiver.countryResidence && (await encryptPII(receiver.countryResidence))) || undefined,
      isSanctioned: receiver.isSanctioned,
      sanctionReason: receiver.isSanctioned && receiver.sanctionReason ? await encryptPII(receiver.sanctionReason) : undefined,
      status: SUBMITTED_BY_APPROVER_STATUS,
      userFileId: taxForm?.id,
      currencyUnitId: singleRequest.currencyUnitId,
      terms: receiver?.terms ?? undefined,
      expectedTransferDate: DateTime.now().plus({ days: 30 }).toISO(),
      vestingStartEpoch: singleRequest.vestingStartEpoch,
      vestingMonths: singleRequest.vestingMonths,
    }
  })

  const data = await Promise.allSettled(promiseList)

  const errors = []
  const finalData = []

  data.forEach(({ status, value, reason }) => {
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

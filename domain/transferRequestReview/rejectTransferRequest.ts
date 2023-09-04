import { PROGRAM_TYPE_INTERNAL } from 'domain/programs/constants'
import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import {
  PROCESSING_STATUS,
  REJECTED_BY_APPROVER_STATUS,
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_STATUS,
} from 'domain/transferRequest/constants'
import { decryptPII } from 'lib/emissaryCrypto'
import { TransactionError } from 'lib/errors'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { sendRejectedNotification } from '../notifications/sendRejectedNotification'
import { REJECTED } from './constants'
import { batchRejectTransferRequestValidator, rejectTransferRequestValidator } from './validation'
import prisma from 'lib/prisma'
import { TransferRequest, User } from '@prisma/client'

interface RejectTransferRequestParams {
  transferRequestId: string
  approverId: number
  notes: string
}

interface BatchRejectTransferRequestParams {
  requests: string[]
  approverId?: number
  notes: string
}

interface TransferRequestTest extends TransferRequest {
  receiver: User
}

export async function rejectTransferRequest(params: RejectTransferRequestParams) {
  const { fields, errors } = await validate(rejectTransferRequestValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId, approverId, notes } = fields

  const { data, error } = await newPrismaTransaction(async fnPrisma => {
    const [transferRequests, approverPrograms] = await Promise.all([
      fnPrisma.transferRequest.findMany({
        where: {
          publicId: transferRequestId,
          status: {
            in: [SUBMITTED_STATUS, PROCESSING_STATUS, REQUIRES_CHANGES_STATUS],
          },
          isActive: true,
        },
        include: {
          receiver: { select: { email: true } },
        },
      }),
      fnPrisma.userRoleProgram.findMany({
        where: {
          isActive: true,
          userRoleId: approverId,
          userRole: {
            role: {
              equals: 'APPROVER',
            },
          },
          program: {
            is: {
              isActive: true,
            },
          },
        },
        select: {
          program: {
            select: {
              id: true,
              visibility: true,
            },
          },
        },
      }),
    ])

    const [currentIteration] = transferRequests
    const currentProgram = approverPrograms.find(({ program }) => program.id === currentIteration?.programId)

    if (!currentIteration || !currentProgram) {
      throw new TransactionError('Transfer request not found', { status: 404, errors: undefined })
    }

    await fnPrisma.transferRequest.update({
      where: {
        id: currentIteration.id,
      },
      data: {
        status: REJECTED_BY_APPROVER_STATUS,
      },
    })

    const { receiver, ...oldTransferRequestValue } = currentIteration
    const newTransferRequestValue = {
      ...oldTransferRequestValue,
      status: REJECTED_BY_APPROVER_STATUS,
    }

    await fnPrisma.transferRequestReview.create({
      data: {
        approverId,
        transferRequestId: oldTransferRequestValue.id,
        status: REJECTED,
        notes,
      },
    })

    await createRequestChangeHistory(fnPrisma, {
      newValue: newTransferRequestValue,
      oldValue: oldTransferRequestValue,
      transferRequestId: oldTransferRequestValue.id,
      userRoleId: approverId,
    })

    if (currentProgram?.program?.visibility !== PROGRAM_TYPE_INTERNAL) {
      const receiverEmail = await decryptPII(receiver.email)
      const { error: notificationError } = await sendRejectedNotification({
        notes,
        email: receiverEmail,
        transferRequestId,
      })
      if (notificationError) {
        throw notificationError
      }
    }

    return newTransferRequestValue
  })

  if (error) {
    return {
      error: {
        status: error.status,
        message: errorsMessages.error_rejecting_transfer_request.message,
      },
    }
  }

  return {
    data,
  }
}

export async function batchRejectTransferRequest(params: BatchRejectTransferRequestParams) {
  const { fields, errors } = await validate(batchRejectTransferRequestValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { requests, approverId, notes } = fields

  const [transferRequests, approverPrograms] = await Promise.all([
    prisma.transferRequest.findMany({
      where: {
        publicId: { in: requests },
        status: {
          in: [SUBMITTED_STATUS, PROCESSING_STATUS],
        },
        isActive: true,
      },
      include: {
        receiver: { select: { email: true } },
      },
    }),
    prisma.userRoleProgram.findMany({
      where: {
        isActive: true,
        userRoleId: approverId,
        userRole: {
          role: {
            equals: 'APPROVER',
          },
        },
        program: {
          is: {
            isActive: true,
          },
        },
      },
      select: {
        program: {
          select: {
            id: true,
            visibility: true,
          },
        },
      },
    }),
  ])

  if (transferRequests.length !== requests.length) {
    return {
      error: {
        status: 404,
        message: errorsMessages.transfer_request_not_found.message,
      },
    }
  }

  const { data, error } = await newPrismaTransaction(async fnPrisma => {
    const promiseList = transferRequests.map(async tRequest => {
      const currentProgram = tRequest && approverPrograms.find(({ program }) => program.id === tRequest.programId)

      if (!currentProgram) {
        throw new TransactionError(errorsMessages.transfer_request_not_found.message, { status: 404, errors: undefined })
      }

      await fnPrisma.transferRequest.update({
        where: {
          id: tRequest.id,
        },
        data: {
          status: REJECTED_BY_APPROVER_STATUS,
        },
      })

      const newTransferRequestValue = {
        ...tRequest,
        status: REJECTED_BY_APPROVER_STATUS,
      }

      await fnPrisma.transferRequestReview.create({
        data: {
          approverId,
          transferRequestId: tRequest.id,
          status: REJECTED,
          notes,
        },
      })

      await createRequestChangeHistory(fnPrisma, {
        newValue: newTransferRequestValue,
        oldValue: tRequest,
        transferRequestId: tRequest.id,
        userRoleId: approverId,
      })

      return newTransferRequestValue
    })

    const data = await Promise.allSettled(promiseList)

    const transferRequestResult = data.map(result => {
      if (result.status === 'rejected') {
        throw { ...result.reason }
      } else {
        return result.value
      }
    })

    return transferRequestResult
  })

  if (error) {
    return {
      error: {
        status: error.status,
        message: errorsMessages.error_rejecting_transfer_request.message,
      },
    }
  }

  const promiseList = (data as TransferRequestTest[]).map(async tRequest => {
    const currentProgram = tRequest && approverPrograms.find(({ program }) => program.id === tRequest.programId)
    if (currentProgram?.program?.visibility !== PROGRAM_TYPE_INTERNAL) {
      const receiverEmail = await decryptPII(tRequest.receiver.email)
      await sendRejectedNotification({
        notes,
        transferRequestId: String(tRequest.id),
        email: receiverEmail,
      })
    }
  })

  await Promise.all(promiseList)

  return {
    data,
  }
}

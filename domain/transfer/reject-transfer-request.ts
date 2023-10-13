import { sendRejectedNotification } from 'domain/notifications/send-rejected-notification'
import { PROGRAM_TYPE_INTERNAL } from 'domain/programs/constants'
import { createRequestChangeHistory } from 'domain/transfer-request-history/create-request-change-history'
import { transferRejectValidator } from 'domain/transfer/validation'
import { APPROVED_STATUS, PROCESSING_STATUS, REJECTED_BY_CONTROLLER_STATUS } from 'domain/transfer-request/constants'
import { decryptPII } from 'lib/emissary-crypto'
import { TransactionError } from 'lib/errors'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { REJECTED } from '../transfer-request-review/constants'

interface RejectTransferRequestParams {
  transferRequestId: string[]
  controllerId: number
  notes: string
}

interface RejectTransferParams {
  transferRequestId: string
  controllerId: number
  notes: string
}

export async function rejectTransferRequest(params: RejectTransferRequestParams) {
  const { errors } = await validate(transferRejectValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const rejectTransfer = async (data: RejectTransferParams) => {
    const { transferRequestId, controllerId, notes } = data

    return await newPrismaTransaction(async fnPrisma => {
      const [currentIteration] = await fnPrisma.transferRequest.findMany({
        where: {
          publicId: transferRequestId,
          status: {
            in: [APPROVED_STATUS, PROCESSING_STATUS],
          },
        },
        include: {
          receiver: { select: { email: true } },
          program: {
            select: {
              visibility: true,
            },
          },
        },
      })
      if (!currentIteration) {
        throw new TransactionError('Transfer request not found', { status: 404, errors: undefined })
      }

      const { program, receiver, ...oldTransferRequestValue } = currentIteration

      await fnPrisma.transferRequest.update({
        where: {
          id: oldTransferRequestValue.id,
        },
        data: {
          status: REJECTED_BY_CONTROLLER_STATUS,
        },
      })

      await fnPrisma.transfer.create({
        data: {
          controllerId: controllerId,
          transferRequestId: oldTransferRequestValue.id,
          status: REJECTED,
          notes,
        },
      })

      const newTransferRequestValue = {
        ...oldTransferRequestValue,
        status: REJECTED_BY_CONTROLLER_STATUS,
      }

      await createRequestChangeHistory(fnPrisma, {
        newValue: newTransferRequestValue,
        oldValue: oldTransferRequestValue,
        transferRequestId: newTransferRequestValue.id,
        userRoleId: controllerId,
      })

      if (program?.visibility !== PROGRAM_TYPE_INTERNAL) {
        const receiverEmail = await decryptPII(receiver.email)
        const { error: notificationError } = await sendRejectedNotification({
          notes,
          email: receiverEmail,
          transferRequestId,
        })
        if (notificationError) {
          throw new Error(errorsMessages.something_went_wrong.message)
        }
      }

      return Promise.resolve(newTransferRequestValue)
    })
  }

  const batchResult = await Promise.all(params.transferRequestId.map(id => rejectTransfer({ ...params, transferRequestId: id })))

  if (batchResult.length === 1 && batchResult[0].error) {
    const { error } = batchResult[0]
    return {
      error: {
        status: error.status,
        message: errorsMessages.error_rejecting_transfer_request.message,
      },
    }
  }

  return batchResult
}

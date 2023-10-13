import {
  APPROVED_STATUS,
  REJECTED_BY_APPROVER_STATUS,
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_STATUS,
  SUBMITTED_BY_APPROVER_STATUS,
  PROCESSING_STATUS,
} from 'domain/transfer-request/constants'
import { sanitizeText } from 'lib/sanitize-text'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { approveTransferRequest } from './approve-transfer-request'
import { rejectTransferRequest } from './reject-transfer-request'
import { requireChangeTransferRequest } from './require-change-transfer-request'
import { submittedTransferRequest } from './submitted-transfer-request'
import { createTransferRequestReviewValidator } from './validation'
import prisma from 'lib/prisma'

interface CreateTransferRequestReviewParams {
  transferRequestId: string
  approverId: number
  status: string
  notes: string
}

export async function createTransferRequestReview(params: CreateTransferRequestReviewParams) {
  const { fields, errors } = await validate(createTransferRequestReviewValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId, approverId, status, notes } = fields

  const sanitizedNotes = notes ? sanitizeText(notes) : (null as string | null)

  if (status === APPROVED_STATUS) {
    return await approveTransferRequest({
      approverId,
      transferRequestId,
    })
  }
  if (status === REJECTED_BY_APPROVER_STATUS) {
    if (!sanitizedNotes) {
      return {
        error: {
          status: 400,
          message: errorsMessages.something_went_wrong.message,
        },
      }
    }
    return await rejectTransferRequest({
      notes: sanitizedNotes,
      approverId,
      transferRequestId,
    })
  }
  if (status === REQUIRES_CHANGES_STATUS) {
    if (notes && !sanitizedNotes) {
      return {
        error: {
          status: 400,
          message: errorsMessages.something_went_wrong.message,
        },
      }
    }

    const transferRequestNotes = sanitizedNotes || (await getLastTransferRequestReviewNotes(transferRequestId, approverId))

    return await requireChangeTransferRequest({
      notes: transferRequestNotes as string | undefined,
      approverId,
      transferRequestId,
    })
  }
  if (status === SUBMITTED_STATUS || status === SUBMITTED_BY_APPROVER_STATUS || status === PROCESSING_STATUS) {
    return await submittedTransferRequest({
      approverId,
      transferRequestId,
    })
  }

  return {
    error: {
      status: 400,
      message: errorsMessages.error_status_is_not_supported.message,
    },
  }
}

const getLastTransferRequestReviewNotes = async (transferRequestId: string, approverId: number) => {
  const result = await prisma.transferRequestReview.findFirst({
    where: {
      transferRequest: {
        publicId: transferRequestId,
      },
      approverId,
      status: REQUIRES_CHANGES_STATUS,
    },
    select: {
      notes: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return result?.notes || undefined
}

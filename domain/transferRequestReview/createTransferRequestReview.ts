import {
  APPROVED_STATUS,
  REJECTED_BY_APPROVER_STATUS,
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_STATUS,
  SUBMITTED_BY_APPROVER_STATUS,
  PROCESSING_STATUS,
} from 'domain/transferRequest/constants'
import { sanitizeText } from 'lib/sanitizeText'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { approveTransferRequest } from './approveTransferRequest'
import { rejectTransferRequest } from './rejectTransferRequest'
import { requireChangeTransferRequest } from './requireChangeTransferRequest'
import { submittedTransferRequest } from './submittedTransferRequest'
import { createTransferRequestReviewValidator } from './validation'

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
    if (!sanitizedNotes) {
      return {
        error: {
          status: 400,
          message: errorsMessages.something_went_wrong.message,
        },
      }
    }
    return await requireChangeTransferRequest({
      notes: sanitizedNotes,
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

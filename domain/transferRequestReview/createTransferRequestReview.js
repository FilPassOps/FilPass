import {
  APPROVED_STATUS,
  BLOCKED_STATUS,
  REJECTED_BY_APPROVER_STATUS,
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_STATUS,
} from 'domain/transferRequest/constants'
import { sanitizeText } from 'lib/sanitizeText'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { approveTransferRequest } from './approveTransferRequest'
import { onHoldTransferRequest } from './onHoldTransferRequest'
import { rejectTransferRequest } from './rejectTransferRequest'
import { requireChangeTransferRequest } from './requireChangeTransferRequest'
import { submittedTransferRequest } from './submittedTransferRequest'
import { createTransferRequestReviewValidator } from './validation'

export async function createTransferRequestReview(params) {
  const { fields, errors } = await validate(createTransferRequestReviewValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId, approverId, status, notes } = fields

  const sanitizedNotes = sanitizeText(notes)

  if (status === APPROVED_STATUS) {
    return await approveTransferRequest({
      approverId,
      transferRequestId,
    })
  }
  if (status === REJECTED_BY_APPROVER_STATUS) {
    return await rejectTransferRequest({
      notes: sanitizedNotes,
      approverId,
      transferRequestId,
    })
  }
  if (status === BLOCKED_STATUS) {
    return await onHoldTransferRequest({
      approverId,
      transferRequestId,
    })
  }
  if (status === REQUIRES_CHANGES_STATUS) {
    return await requireChangeTransferRequest({
      notes: sanitizedNotes,
      approverId,
      transferRequestId,
    })
  }
  if (status === SUBMITTED_STATUS) {
    return await submittedTransferRequest({
      approverId,
      transferRequestId,
    })
  }

  return {
    status: 400,
    error: {
      message: errorsMessages.error_status_is_not_supported.message,
    },
  }
}

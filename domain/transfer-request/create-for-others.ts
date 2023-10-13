import { createTransferRequestDraft } from 'domain/transfer-request-draft/create-transfer-request-draft'
import { isEmpty } from 'lodash'
import { batchCreateTransferRequest } from './batch-create-transfer-request'
import { payloadContainsRequesterEmail } from './validation'
import { TransferRequest } from '@prisma/client'

interface CreateForOthersParams {
  requests: any[]
  requesterId: number
  approverRoleId: number
  isBatchCsv?: boolean
  approver: {
    email: string
  }
}

interface Result {
  data: TransferRequest[]
  error: any
}

export const createForOthers = async ({ requests, requesterId, approverRoleId, isBatchCsv = false, approver }: CreateForOthersParams) => {
  const containsApproverError = payloadContainsRequesterEmail(requests, approver)

  if (!isEmpty(containsApproverError) && !isBatchCsv) {
    return {
      error: {
        status: 400,
        errors: containsApproverError,
      },
    }
  }

  const draftsBatch = []
  const requestsBatch = []

  for (const request of requests) {
    if (request.shouldReceiverReview) {
      draftsBatch.push(request)
    } else {
      requestsBatch.push(request)
    }
  }

  const result: Result = { data: [], error: undefined }

  if (draftsBatch.length) {
    const { data, error } = await createTransferRequestDraft({
      requests: draftsBatch,
      requesterId,
      approverRoleId,
    })

    if (error) return { error, data: [] }

    if (data && Array.isArray(data)) {
      result.data.push(...data)
    }
  }

  if (requestsBatch.length) {
    try {
      const { data, error } = await batchCreateTransferRequest({
        requests: requestsBatch,
        requesterId,
        approverRoleId,
        isBatchCsv,
      })

      if (error) {
        return { error, data: [] }
      }

      if (data && Array.isArray(data)) {
        result.data.push(...data)
      }
    } catch (error) {
      return { error, data: [] }
    }
  }

  return result
}

import { createTransferRequestDraft } from 'domain/transferRequestDraft/createTransferRequestDraft'
import { isEmpty } from 'lodash'
import { batchCreateTransferRequest } from './batchCreateTransferRequest'
import { payloadContainsRequesterEmail } from './validation'

interface CreateForOthersParams {
  requests: any[]
  requesterId: number
  approverRoleId: number
  isBatchCsv?: boolean
  approver: {
    email: string
  }
}

// TODO: change any after transforming batchCreateTransferRequest and createTransferRequestDraft to typescript
interface Result {
  data: any[]
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

  const result: Result = { data: [] }

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

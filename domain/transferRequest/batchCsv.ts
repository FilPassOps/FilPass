import { flatMap, groupBy, mapValues, uniqBy } from 'lodash'
import { createForOthers } from './createForOthers'

interface Request {
  row: number
  wallet: string
  receiverEmail: string
  amount: number
  currency: string
  reason: string
  skipWalletCreation: boolean
}

interface BatchCsvParams {
  requests: Request[]
  requesterId: number
  approverRoleId: number
  approver: {
    email: string
  }
}

// TODO: add validator?
export async function batchCsv({ requests, requesterId, approverRoleId, approver }: BatchCsvParams) {
  const cleanedRequests = cleanRequests(requests)

  return await createForOthers({
    requests: cleanedRequests,
    requesterId,
    approverRoleId,
    isBatchCsv: true,
    approver,
  })
}

const cleanRequests = (requests: Request[]) => {
  const uniqueWalletsAndEmails = mapValues(groupBy(requests, 'wallet'), value => uniqBy(value, 'receiverEmail'))
  const uniqueRequests = flatMap(uniqueWalletsAndEmails, (value, key) => value.map(v => ({ ...v, wallet: key })))

  return requests.map((request) => {
    if (!uniqueRequests.find(r => r.row === request.row)) {
      return { ...request, skipWalletCreation: true }
    } else {
      return { ...request, skipWalletCreation: false }
    }
  })
}

import { flatMap, groupBy, mapValues, uniqBy } from 'lodash'
import { createForOthers } from './createForOthers'

export async function batchCsv({ requests, requesterId, approverRoleId, approver }) {
  const cleanedRequests = cleanRequests(requests)

  return await createForOthers({
    requests: cleanedRequests,
    requesterId,
    approverRoleId,
    isBatchCsv: true,
    approver,
  })
}

const cleanRequests = requests => {
  const uniqueWalletsAndEmails = mapValues(groupBy(requests, 'wallet'), value => uniqBy(value, 'receiverEmail'))
  const uniqueRequests = flatMap(uniqueWalletsAndEmails, (value, key) => value.map(v => ({ ...v, wallet: key })))

  return requests.map(request => {
    if (!uniqueRequests.find(r => r.row === request.row)) {
      return { ...request, skipWalletCreation: true }
    } else {
      return { ...request, skipWalletCreation: false }
    }
  })
}

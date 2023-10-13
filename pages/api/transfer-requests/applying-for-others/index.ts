import { createForOthers } from 'domain/transfer-request/create-for-others'
import { NextApiRequestWithSession, newHandler, withApprover, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  return await handlePostRequest(req, res)
}

const handlePostRequest = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  const requesterId = req.user?.id as number
  const approverRoleId = req.approverId as number
  const approver = req.user as any

  const receiverShouldReview = req.body?.receiverShouldReview as boolean
  const requests = req.body.requests as any[]

  let requestsBatch = requests

  if (receiverShouldReview) {
    requestsBatch = requests.map(request => ({ ...request, shouldReceiverReview: true }))
  }

  const { data, error } = (await createForOthers({
    requests: requestsBatch,
    requesterId,
    approverRoleId,
    approver,
  })) as any

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withApprover(withMethods(['POST'], handler)))

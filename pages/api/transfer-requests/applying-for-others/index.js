import { createForOthers } from 'domain/transferRequest/createForOthers'
import { newHandler, withApprover, withMethods } from 'lib/middleware'

async function handler(req, res) {
  return await handlePostRequest(req, res)
}

const handlePostRequest = async (req, res) => {
  const { requests, receiverShouldReview } = req.body

  const requesterId = req.user.id
  const approverRoleId = req.approverId
  const approver = req.user

  let requestsBatch = requests

  if (receiverShouldReview) {
    requestsBatch = requests.map(request => ({ ...request, shouldReceiverReview: true }))
  }

  const { data, error } = await createForOthers({
    receiverShouldReview,
    requests: requestsBatch,
    requesterId,
    approverRoleId,
    approver,
  })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withApprover(withMethods(['POST'], handler)))

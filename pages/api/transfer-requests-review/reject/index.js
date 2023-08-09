import { batchRejectTransferRequest } from 'domain/transferRequestReview/rejectTransferRequest'
import { newHandler, withMethods, withApprover } from 'lib/middleware'

async function handler(req, res) {
  const approverId = req.approverId

  const { requests, notes } = req.body

  const { data, error } = await batchRejectTransferRequest({
    requests,
    notes,
    approverId,
  })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withApprover(withMethods(['POST'], handler)))
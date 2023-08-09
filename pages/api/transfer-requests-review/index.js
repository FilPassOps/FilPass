import { createTransferRequestReview } from 'domain/transferRequestReview/createTransferRequestReview'
import { newHandler, withMethods, withApprover } from 'lib/middleware'

async function handler(req, res) {
  const approverId = req.approverId

  const { data, error } = await createTransferRequestReview({
    ...req.body,
    approverId,
  })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withApprover(withMethods(['POST'], handler)))

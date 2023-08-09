import { voidTransferRequest } from 'domain/transferRequest/voidTransferRequest'
import { newHandler, withMethods, withUser } from 'lib/middleware'

async function handler(req, res) {
  const transferRequestId = req.query.id
  const userId = req.user.id

  const { data, error } = await voidTransferRequest({ transferRequestId, userId })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withUser(withMethods(['POST'], handler)))

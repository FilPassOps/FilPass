import { rejectTransferRequest } from 'domain/transfer/rejectTransferRequest'
import { newHandler, withMethods, withController } from 'lib/middleware'

async function handler(req, res) {
  const controllerId = req.controllerId

  const { error } = await rejectTransferRequest({
    ...req.body,
    controllerId,
  })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json({})
}

export default newHandler(withController(withMethods(['POST'], handler)))
import { rejectTransferRequest } from 'domain/transfer/reject-transfer-request'
import { newHandler, withMethods, withController, NextApiRequestWithSession } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const controllerId = req.controllerId

  const { error } = (await rejectTransferRequest({
    ...req.body,
    controllerId,
  })) as { error: any }

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json({})
}

export default newHandler(withController(withMethods(['POST'], handler)))

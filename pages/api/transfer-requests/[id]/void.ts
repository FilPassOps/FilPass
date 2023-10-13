import { voidTransferRequest } from 'domain/transfer-request/void-transfer-request'
import { NextApiRequestWithSession, newHandler, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const transferRequestId = req.query.id as string | undefined
  const userId = req.user?.id

  const { data, error } = await voidTransferRequest({ transferRequestId, userId })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withUser(withMethods(['POST'], handler)))

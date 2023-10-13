import { createTransferRequestReview } from 'domain/transfer-request-review/create-transfer-request-review'
import { newHandler, withMethods, withApprover, NextApiRequestWithSession } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
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

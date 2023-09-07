import { batchRejectTransferRequest } from 'domain/transferRequestReview/rejectTransferRequest'
import { newHandler, withMethods, withApprover, NextApiRequestWithSession } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
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
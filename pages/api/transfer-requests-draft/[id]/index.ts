import { deleteDraftTransferRequestById } from 'domain/transferRequestDraft/deleteDraftTransferRequestById'
import { submitDraftTransferRequestById } from 'domain/transferRequestDraft/submitDraftTransferRequestById'
import { NextApiRequestWithSession, newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method === 'PATCH') {
    return await handlePatchRequest(req, res)
  }

  return await handlePostRequest(req, res)
}

async function handlePatchRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const publicId = req.query.id as string
  const userId = req.user?.id as number

  const { data, error } = await deleteDraftTransferRequestById({
    publicId,
    userId,
  })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

async function handlePostRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const publicId = req.query.id

  const { data, error } = await submitDraftTransferRequestById({
    ...req.body,
    publicId,
    user: req.user,
  })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withUser(withMethods(['POST', 'PATCH'], handler))))

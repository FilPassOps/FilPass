import { deleteDraftTransferRequestById } from 'domain/transferRequestDraft/deleteDraftTransferRequestById'
import { submitDraftTransferRequestById } from 'domain/transferRequestDraft/submitDraftTransferRequestById'
import { newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'

async function handler(req, res) {
  if (req.method === 'PATCH') {
    return await handlePatchRequest(req, res)
  }

  return await handlePostRequest(req, res)
}

async function handlePatchRequest(req, res) {
  const publicId = req.query.id
  const userId = req.user.id

  const { data, error } = await deleteDraftTransferRequestById({
    publicId,
    userId,
  })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

async function handlePostRequest(req, res) {
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

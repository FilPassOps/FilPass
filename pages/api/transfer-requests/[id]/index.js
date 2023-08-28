import { deleteTransferRequestById } from 'domain/transferRequest/deleteTransferRequestById'
import { updateTransferRequestById } from 'domain/transferRequest/updateTransferRequestById'
import { newHandler, withMethods, withUser } from 'lib/middleware'

async function handler(req, res) {
  if (req.method === 'PATCH') {
    return await handlePatchRequest(req, res)
  }

  return await handleDeleteRequest(req, res)
}

const handlePatchRequest = async (req, res) => {
  if (!req.user.isOnboarded) return res.status(403).send({ message: 'Forbidden' })

  const transferRequestId = req.query.id

  const { data, error } = await updateTransferRequestById({
    ...req.body,
    transferRequestId,
    user: req.user,
  })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

const handleDeleteRequest = async (req, res) => {
  // TODO: check the params
  const { data, error } = await deleteTransferRequestById({ transferRequestId: req.query.id }, req.user)

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withUser(withMethods(['PATCH', 'DELETE'], handler)))

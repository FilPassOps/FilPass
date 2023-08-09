import { getTemporaryFile } from 'domain/files/getTemporaryFile'
import { deleteTemporaryFile } from 'domain/files/deleteTemporaryFile'
import { newHandler, withMethods, withApprover, withLimiter } from 'lib/middleware'

async function handler(req, res) {
  if (req.method === 'GET') {
    return await handleGetRequest(req, res)
  }

  return await handleDeleteRequest(req, res)
}

async function handleGetRequest(req, res) {
  const publicId = req.query.id
  const uploaderId = req.user.id

  const { data, error } = await getTemporaryFile({ publicId, uploaderId })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

async function handleDeleteRequest(req, res) {
  const id = req.query.id
  const { error, data } = await deleteTemporaryFile({ id })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withApprover(withMethods(['GET', 'DELETE'], handler))))

import { deleteFile } from 'domain/files/deleteFile'
import { getUserFile } from 'domain/files/getUserFile'
import { newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'

async function handler(req, res) {
  if (req.method === 'GET') {
    return await handleGetRequest(req, res)
  }

  return await handleDeleteRequest(req, res)
}

async function handleGetRequest(req, res) {
  const id = req.query.id
  const { error, data } = await getUserFile({ filePublicId: id, user: req.user })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

async function handleDeleteRequest(req, res) {
  const id = req.query.id
  const { error, data } = await deleteFile({ id }, req.user)

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withUser(withMethods(['DELETE', 'GET'], handler))))

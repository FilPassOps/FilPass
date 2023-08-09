import { createTransferRequest } from 'domain/transferRequest/createTransferRequest'
import { deleteTransferRequestById } from 'domain/transferRequest/deleteTransferRequestById'
import { getUserTransferRequests } from 'domain/transferRequest/getUserTransferRequests'
import { newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'
import qs from 'qs'

async function handler(req, res) {
  if (req.method === 'GET') {
    return await handleGetRequest(req, res)
  }

  if (req.method === 'DELETE') {
    return await handleDeleteRequest(req, res)
  }

  return await handlePostRequest(req, res)
}

const handleGetRequest = async (req, res) => {
  const userId = req.user.id
  const query = req.query

  const { data, error } = await getUserTransferRequests({ userId, ...query })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

const handlePostRequest = async (req, res) => {
  if (!req.user.isOnboarded) return res.status(403).send({ message: 'Forbidden' })

  const { data, error } = await createTransferRequest({ ...req.body, user: req.user })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

const handleDeleteRequest = async (req, res) => {
  const { requests } = qs.parse(req.query)
  const { data, error } = await deleteTransferRequestById({ requests: requests.split(',') }, req.user)

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withUser(withMethods(['POST', 'GET', 'DELETE'], handler))))

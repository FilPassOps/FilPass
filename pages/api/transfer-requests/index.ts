import { createTransferRequest } from 'domain/transfer-request/create-transfer-request'
import { deleteTransferRequestById } from 'domain/transfer-request/delete-transfer-request-by-id'
import { getUserTransferRequests } from 'domain/transfer-request/get-user-transfer-requests'
import { NextApiRequestWithSession, SessionUser, newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next/types'
import qs from 'qs'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await handleGetRequest(req, res)
  }

  if (req.method === 'DELETE') {
    return await handleDeleteRequest(req, res)
  }

  return await handlePostRequest(req, res)
}

const handleGetRequest = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  const userId = req.user?.id
  const query = req.query

  const { data, error } = await getUserTransferRequests({ userId, ...query })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

const handlePostRequest = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  if (!req.user?.isOnboarded) return res.status(403).send({ message: 'Forbidden' })

  const { data, error } = await createTransferRequest({ ...req.body, user: req.user })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

const handleDeleteRequest = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  const { requests } = qs.parse(req.query as any) as any
  const { data, error } = await deleteTransferRequestById({ requests: requests.split(',') }, req.user as SessionUser)

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withUser(withMethods(['POST', 'GET', 'DELETE'], handler))))

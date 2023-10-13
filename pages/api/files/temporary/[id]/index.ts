import { getTemporaryFile } from 'domain/files/get-temporary-file'
import { deleteTemporaryFile } from 'domain/files/delete-temporary-file'
import { newHandler, withMethods, withApprover, withLimiter, NextApiRequestWithSession } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await handleGetRequest(req, res)
  }

  return await handleDeleteRequest(req, res)
}

async function handleGetRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const publicId = req.query.id as string | undefined
  const uploaderId = req.user?.id

  const { data, error } = await getTemporaryFile({ publicId, uploaderId })

  if (error) {
    return res.status(error.status || 500).json(error)
  }

  return res.status(200).json(data)
}

async function handleDeleteRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const id = req.query.id as string | undefined
  const { error, data } = await deleteTemporaryFile({ id })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withApprover(withMethods(['GET', 'DELETE'], handler))))

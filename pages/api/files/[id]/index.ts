import { deleteFile } from 'domain/files/deleteFile'
import { getUserFile } from 'domain/files/getUserFile'
import { NextApiRequestWithSession, newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await handleGetRequest(req, res)
  }

  return await handleDeleteRequest(req, res)
}

async function handleGetRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const id = req.query.id
  const { error, data } = await getUserFile({ filePublicId: id as string, user: req.user as any }) as {error: any, data: {file: any, info: any} }

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

async function handleDeleteRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const id = req.query.id
  const { error, data } = await deleteFile({ id: id as string }, req.user as any)

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withUser(withMethods(['DELETE', 'GET'], handler))))

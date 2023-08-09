import { getUserFileReadStream } from 'domain/files/getUserFile'
import { newHandler, NextApiRequestWithSession, SessionUser, withLimiter, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await handleGetRequest(req, res)
  }
}

async function handleGetRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const id = req.query.id as string
  const { user } = req

  const { error, data } = await getUserFileReadStream({ filePublicId: id, user: user as SessionUser })

  if (error || !data) {
    return res.status(error.status).json(error)
  }

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=${data.fileName}`)

  data.readStream.pipe(res)
}

export default newHandler(withLimiter(withUser(withMethods(['GET'], handler))))

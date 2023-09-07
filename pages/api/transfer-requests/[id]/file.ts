import { getFileUrlFromS3 } from 'domain/files/getFileUrlFromS3'
import { NextApiRequestWithSession, newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const transferRequestId = req.query.id as string | undefined
  const userId = req.user?.id

  const { data, error } = await getFileUrlFromS3({
    transferRequestId,
    userId,
  })

  if (error) {
    return res.status(error.status || 500).json(error)
  }

  return res.status(200).send(data)
}

export default newHandler(withLimiter(withUser(withMethods(['GET'], handler))))

import { createFile } from 'domain/files/createFile'
import { NextApiRequestWithSession, newHandler, withFile, withLimiter, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

export interface NextApiRequestWithSessionAndFile extends NextApiRequestWithSession {
  file?: File
}

async function handler(req: NextApiRequestWithSessionAndFile, res: NextApiResponse) {
  const body = JSON.parse(req.body.data)
  const file = req.file
  const userId = req.user?.id

  const { data, error } = await createFile({ ...body, file, userId })
  if (error) {
    return res.status(error.status || 500).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withFile(withUser(withMethods(['POST'], handler)))))

export const config = {
  api: {
    bodyParser: false,
  },
}

import { createTemporaryFile } from 'domain/files/createTemporaryFile'
import { newHandler, withFile, withMethods, withApprover, withLimiter } from 'lib/middleware'
import { NextApiRequestWithSessionAndFile } from '..'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSessionAndFile, res: NextApiResponse) {
  const body = JSON.parse(req.body.data)
  const file = req.file
  const uploaderId = req.user?.id

  const { data, error } = await createTemporaryFile({ ...body, file, uploaderId })
  if (error) {
    return res.status(error.status || 500).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withFile(withApprover(withMethods(['POST'], handler)))))

export const config = {
  api: {
    bodyParser: false,
  },
}

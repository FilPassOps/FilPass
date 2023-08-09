import { createTemporaryFile } from 'domain/files/createTemporaryFile'
import { newHandler, withFile, withMethods, withApprover, withLimiter } from 'lib/middleware'

async function handler(req, res) {
  const body = JSON.parse(req.body.data)
  const file = req.file
  const uploaderId = req.user.id

  const { data, error } = await createTemporaryFile({ ...body, file, uploaderId })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withFile(withApprover(withMethods(['POST'], handler)))))

export const config = {
  api: {
    bodyParser: false,
  },
}

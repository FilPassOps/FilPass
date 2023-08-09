import { createFile } from 'domain/files/createFile'
import { newHandler, withFile, withLimiter, withMethods, withUser } from 'lib/middleware'

async function handler(req, res) {
  const body = JSON.parse(req.body.data)
  const file = req.file
  const userId = req.user.id

  const { data, error } = await createFile({ ...body, file, userId })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withFile(withUser(withMethods(['POST'], handler)))))

export const config = {
  api: {
    bodyParser: false,
  },
}

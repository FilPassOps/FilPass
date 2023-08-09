import { getFileUrlFromS3 } from 'domain/files/getFileUrlFromS3'
import { newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'

async function handler(req, res) {
  const transferRequestId = req.query.id
  const userId = req.user.id

  const { data, error } = await getFileUrlFromS3({
    transferRequestId,
    userId,
  })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).send(data)
}

export default newHandler(withLimiter(withUser(withMethods(['GET'], handler))))

import { resetPassword } from 'domain/auth/resetPassword'
import { newHandler, withAuthLimiter, withMethods, withSession } from 'lib/middleware'

async function handler(req, res) {
  const { error, data } = await resetPassword(req.body)
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withAuthLimiter(withSession(withMethods(['POST'], handler))))

import { sendEmailVerification } from 'domain/notifications/sendEmailVerification'
import { newHandler, withMethods, withSession, withAuthLimiter } from 'lib/middleware'

async function handler(req, res) {
  const { data, error } = await sendEmailVerification(req.body)

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withAuthLimiter(withSession(withMethods(['POST'], handler))))

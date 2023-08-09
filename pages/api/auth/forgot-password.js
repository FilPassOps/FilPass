import { sendEmailForgotPassword } from 'domain/notifications/sendEmailForgotPassword'
import { newHandler, withMethods, withAuthLimiter } from 'lib/middleware'

async function handler(req, res) {
  const { data, error } = await sendEmailForgotPassword(req.body)
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withAuthLimiter(withMethods(['POST'], handler)))

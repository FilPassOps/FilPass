import { login } from 'domain/auth/login'
import { newHandler, withMethods, withAuthLimiter } from 'lib/middleware'

async function handler(req, res) {
  const { data, error } = await login(req.body)
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withAuthLimiter(withMethods(['POST'], handler)))

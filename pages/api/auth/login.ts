import { login } from 'domain/auth/login'
import { newHandler, withMethods, withAuthLimiter } from 'lib/middleware'
import { NextApiRequest, NextApiResponse } from 'next/types'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await login(req.body)
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withAuthLimiter(withMethods(['POST'], handler)))

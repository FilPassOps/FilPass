import { signup } from 'domain/auth/signup'
import { newHandler, withMethods, withSession, withAuthLimiter } from 'lib/middleware'
import { NextApiRequest, NextApiResponse } from 'next/types'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await signup(req.body)
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withAuthLimiter(withSession(withMethods(['POST'], handler))))

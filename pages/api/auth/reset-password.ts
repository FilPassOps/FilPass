import { resetPassword } from 'domain/auth/resetPassword'
import { newHandler, withAuthLimiter, withMethods, withSession } from 'lib/middleware'
import { NextApiRequest, NextApiResponse } from 'next/types'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { error, data } = await resetPassword(req.body) as { error: any; data: any}
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withAuthLimiter(withSession(withMethods(['POST'], handler))))

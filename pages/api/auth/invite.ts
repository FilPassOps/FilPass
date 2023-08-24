import { invite } from 'domain/auth/invite'
import { newHandler, withMethods, withSuperAdmin, withLimiter, NextApiRequestWithSession } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const superAdminId = req.superAdminId
  const { data, error } = await invite({ ...req.body, superAdminId })

  if (error) {
    return res.status(error.status).json(error)
  }
  return res.status(200).json(data)
}

export default newHandler(withLimiter(withSuperAdmin(withMethods(['POST'], handler))))

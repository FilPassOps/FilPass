import prisma from 'lib/prisma'
import { createWallet } from 'domain/wallet/createWallet'
import { NextApiRequestWithSession, newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const { data, error } = await createWallet(prisma, { ...req.body, userId: req.user?.id, email: req.user?.email })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withUser(withMethods(['POST'], handler))))

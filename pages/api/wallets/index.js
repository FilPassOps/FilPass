import { getPrismaClient } from 'lib/prisma'
import { createWallet } from 'domain/wallet/createWallet'
import { newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'

async function handler(req, res) {
  const prisma = await getPrismaClient()
  const { data, error } = await createWallet(prisma, { ...req.body, userId: req.user.id, email: req.user.email })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withUser(withMethods(['POST'], handler))))

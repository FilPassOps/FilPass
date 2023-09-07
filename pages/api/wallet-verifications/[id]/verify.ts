import { verifyWallet } from 'domain/walletVerification/verifyWallet'
import { NextApiRequestWithSession, newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const userId = req.user?.id
  const verificationId = req.query.id

  const { data, error } = await verifyWallet({ ...req.body, userId, verificationId, email: req.user?.email })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withUser(withMethods(['POST'], handler))))

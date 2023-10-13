import { deleteWallet } from 'domain/wallet/delete-wallet'
import { NextApiRequestWithSession, newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const userId = req.user?.id
  const id = Number(req.query.id)

  const { data, error } = await deleteWallet({ userId, id })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withUser(withMethods(['DELETE'], handler))))

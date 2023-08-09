import { deleteWallet } from 'domain/wallet/deleteWallet'
import { newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'

async function handler(req, res) {
  const userId = req.user.id
  const id = req.query.id

  const { data, error } = await deleteWallet({ userId, id })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withUser(withMethods(['DELETE'], handler))))

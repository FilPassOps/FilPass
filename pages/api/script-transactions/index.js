import { scriptTransactions } from 'domain/transfer/scriptTransactions'
import { newHandler, withAuthToken, withLimiter, withMethods } from 'lib/middleware'

async function handler(req, res) {
  const { data, error } = await scriptTransactions({ ...req.body })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withLimiter(withAuthToken(withMethods(['POST'], handler))))

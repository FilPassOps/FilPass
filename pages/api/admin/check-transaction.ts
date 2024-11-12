import { NextApiRequest, NextApiResponse } from 'next'
import { checkTransaction } from 'domain/transaction/check-transaction'
import { withSuperAdmin } from 'lib/middleware'
import { withMethods } from 'lib/middleware'
import { newHandler } from 'lib/middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { hash, email, transactionType, receiverWallet } = req.body

  if (!hash || !email || !transactionType || !receiverWallet) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const result = await checkTransaction({ hash, email, transactionType, receiverWallet })
  return res.status(200).json(result)
}

export default newHandler(withSuperAdmin(withMethods(['POST'], handler)))

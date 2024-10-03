import type { NextApiResponse } from 'next'

import { newHandler, NextApiRequestWithSession, withMethods, withRoles } from 'lib/middleware'
import { buyCredits } from 'domain/transfer-credits/buy-credits'
import { USER_ROLE } from 'domain/auth/constants'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method === 'POST') {
    return await handlePostRequest(req, res)
  }
}

async function handlePostRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const user = req.user

  if (!user) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const { message, error } = await buyCredits({
    from: req.body.from,
    to: req.body.to,
    amount: req.body.amount,
    userId: user.id,
    hash: req.body.hash,
    unit: req.body.unit,
  })

  if (error) {
    return res.status(400).json(error)
  }

  return res.status(200).json({ message })
}

export default newHandler(withRoles([USER_ROLE], withMethods(['PATCH', 'POST'], handler)))

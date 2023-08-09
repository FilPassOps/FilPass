import { invalidateSession } from 'domain/auth/session'
import { newHandler, NextApiRequestWithSession, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.session.identifier) {
    await invalidateSession({ sessionId: req.session.identifier })
  }
  req.user = undefined
  req.session.user = undefined
  req.session.destroy()
  return res.status(200).json({ success: true })
}

export default newHandler(withUser(withMethods(['GET'], handler)))

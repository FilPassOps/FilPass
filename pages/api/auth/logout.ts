import { invalidateSession } from 'domain/auth/session'
import { newHandler, NextApiRequestWithSession, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  console.log('🚪 Logout requested', {
    hasSession: !!req.session,
    sessionId: req.session?.identifier
  });

  if (req.session.identifier) {
    console.log('🗑️ Invalidating session in DB', { sessionId: req.session.identifier });
    await invalidateSession({ sessionId: req.session.identifier })
  }

  req.user = undefined
  req.session.user = undefined
  console.log('🗑️ Destroying session cookie');
  req.session.destroy()
  console.log('✅ Session destroyed successfully');

  return res.status(200).json({ success: true })
}

export default newHandler(withMethods(['POST'], handler))

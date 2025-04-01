import { generateSession } from 'domain/auth/session'
import { verifyCode } from 'domain/auth/verify-code'
import { NextApiRequestWithSession, newHandler, withMethods, withSession } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const { code, token } = req.body
  console.log('🔑 Verifying code', { hasCode: !!code, hasToken: !!token });

  const { data, error } = await verifyCode({ code, token })
  if (error) {
    console.log('❌ Code verification failed', error);
    return res.status(error.status).json(error)
  }

  console.log('✅ Code verification successful', { userId: data.user.id });

  const { id: sessionId } = await generateSession({
    userId: data.user.id,
  })
  console.log('🔐 Session generated', { sessionId });

  req.session.user = data.user as any
  req.session.identifier = sessionId

  console.log('💾 Saving session to cookie');
  await req.session.save()
  console.log('✅ Session saved to cookie');

  return res.status(200).json({})
}

export default newHandler(withSession(withMethods(['POST'], handler)))

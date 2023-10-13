import { generateSession } from 'domain/auth/session'
import { signinWithGoogle } from 'domain/auth/signin-with-google'
import { getGoogleUser } from 'lib/google/login'
import { logger } from 'lib/logger'
import { NextApiRequestWithSession, newHandler, withAuthLimiter, withMethods, withSession } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const { data: googleUser, error: googleUserError } = await getGoogleUser({ code: req.body.code })

  if (googleUserError) {
    logger.error('Error getting Google user', googleUserError)
    return res.status(googleUserError.status).json(googleUserError)
  }

  const { data } = await signinWithGoogle({ email: googleUser.email })

  const { id: sessionId } = await generateSession({
    userId: data.id,
  })

  req.session.user = data as any
  req.session.identifier = sessionId
  await req.session.save()

  return res.status(200).json({ ...data })
}

export default newHandler(withAuthLimiter(withSession(withMethods(['POST'], handler))))

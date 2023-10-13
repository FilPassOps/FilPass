import { generateSession } from 'domain/auth/session'
import { verifyCode } from 'domain/auth/verify-code'
import { NextApiRequestWithSession, newHandler, withMethods, withSession } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const { code, token } = req.body

  const { data, error } = await verifyCode({ code, token })
  if (error) {
    return res.status(error.status).json(error)
  }

  const { id: sessionId } = await generateSession({
    userId: data.user.id,
  })

  req.session.user = data.user as any
  req.session.identifier = sessionId
  await req.session.save()

  return res.status(200).json({})
}

export default newHandler(withSession(withMethods(['POST'], handler)))

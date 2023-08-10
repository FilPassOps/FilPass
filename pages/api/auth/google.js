import { generateSession } from 'domain/auth/session'
import { signinWithGoogle } from 'domain/auth/signinWithGoogle'
import { getGoogleUser } from 'lib/google/login'
import { newHandler, withAuthLimiter, withMethods, withSession } from 'lib/middleware'

async function handler(req, res) {
  const { data: googleUser, error: googleUserError } = await getGoogleUser({ code: req.body.code })

  if (googleUserError) {
    console.log({ googleUserError })
    return res.status(googleUserError.status).json(googleUserError)
  }

  const { data, error } = await signinWithGoogle({ email: googleUser.email })

  if (error) {
    console.log({ error })
    return res.status(error.status).json(error)
  }

  const { id: sessionId } = await generateSession({
    userId: data.id,
  })

  req.session.user = data
  req.session.identifier = sessionId
  await req.session.save()

  return res.status(200).json({ ...data })
}

export default newHandler(withAuthLimiter(withSession(withMethods(['POST'], handler))))

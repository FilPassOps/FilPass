import { newHandler, withLimiter, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next'
import { subscribeToNewsletter } from 'domain/newsletter/subscribe'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface Request {
  body: {
    email: string
  }
}

export const handler = async (req: Request, res: NextApiResponse) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Email is required' })
  }

  try {
    const { error } = await subscribeToNewsletter({ email })

    if (error) {
      return res.status(400).json({ message: error.message || errorsMessages.something_went_wrong.message })
    }
  } catch (error) {
    return res.status(500).json({ message: errorsMessages.something_went_wrong.message })
  }

  return res.status(200).json({ message: 'Success' })
}

export default newHandler(withLimiter(withMethods(['POST'], handler)))

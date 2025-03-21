import { getUserByIdAndEmail } from 'domain/user/get-by-id-and-email'
import { newHandler, NextApiRequestWithSession, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const user = req.user

  if (!user) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const { data, error } = await getUserByIdAndEmail({ userId: user.id, email: user.email })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json({
    ...data,
  })
}

export default newHandler(withUser(withMethods(['GET'], handler)))

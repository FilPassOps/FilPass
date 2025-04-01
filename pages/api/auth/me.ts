import { getUserByIdAndEmail } from 'domain/user/get-by-id-and-email'
import { newHandler, NextApiRequestWithSession, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  console.log('📝 /me endpoint called');

  const user = req.user;
  console.log('👤 User from request', { userId: user?.id });

  if (!user) {
    console.log('❌ No user found in request');
    return res.status(403).send({ message: 'Forbidden' })
  }

  const { data, error } = await getUserByIdAndEmail({ userId: user.id, email: user.email })

  if (error) {
    console.log('❌ Error getting user from database', error);
    return res.status(error.status).json(error)
  }

  console.log('✅ Successfully returning user data from /me');
  return res.status(200).json({
    ...data,
  })
}

export default newHandler(withUser(withMethods(['GET'], handler)))

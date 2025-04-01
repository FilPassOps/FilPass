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

  try {
    const { data, error } = await getUserByIdAndEmail({ userId: user.id, email: user.email })

    if (error) {
      console.log('❌ Error getting user from database', error);

      // Return the session user data instead of failing
      // This prevents session destruction due to temporary DB issues
      console.log('⚠️ Falling back to session user data');
      return res.status(200).json({
        id: user.id,
        email: user.email,
        roles: user.roles || [],
        ...(user as any)
      });
    }

    console.log('✅ Successfully returning user data from /me');
    return res.status(200).json({
      ...data,
    })
  } catch (err) {
    console.error('Unexpected error in /me endpoint:', err);

    // Fall back to session data on any error
    return res.status(200).json({
      id: user.id,
      email: user.email,
      roles: user.roles || [],
      ...(user as any)
    });
  }
}

export default newHandler(withUser(withMethods(['GET'], handler)))

import { updateUserBan } from 'domain/user/update-user-ban'
import { newHandler, NextApiRequestWithSession, withMethods, withSuperAdmin } from 'lib/middleware'
import { NextApiResponse } from 'next'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const id = req.query.id
  const superAdminUserRoleId = req.userRoleId

  if (!superAdminUserRoleId || !id) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  try {
    const result = await updateUserBan({ id: +id, isBanned: false, superAdminUserRoleId })
    return res.status(200).json({ isBanned: result.isBanned, id: result.id })
  } catch (error: any) {
    console.error(error)
    return res.status(400).json({ message: 'An unexpected error happened. Please, try again.' })
  }
}

export default newHandler(withSuperAdmin(withMethods(['POST'], handler)))

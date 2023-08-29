import { updateRoles } from 'domain/roles/updateRoles'
import { NextApiRequestWithSession, newHandler, withMethods, withSuperAdmin } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const userId = req.query.userId
  const { error, data } = await updateRoles({ ...req.body, userId })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withSuperAdmin(withMethods(['POST'], handler)))

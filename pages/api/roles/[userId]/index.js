import { updateRoles } from 'domain/roles/updateRoles'
import { newHandler, withMethods, withSuperAdmin } from 'lib/middleware'

async function handler(req, res) {
  const userId = req.query.userId
  const { error, data } = await updateRoles({ ...req.body, userId })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withSuperAdmin(withMethods(['POST'], handler)))

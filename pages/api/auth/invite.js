import { invite } from 'domain/auth/invite'
import { newHandler, withMethods, withSuperAdmin, withLimiter } from 'lib/middleware'

async function handler(req, res) {
  const superAdminId = req.superAdminId
  const { data, error } = await invite({ ...req.body, superAdminId })

  if (error) {
    return res.status(error.status).json(error)
  }
  return res.status(200).json(data)
}

export default newHandler(withLimiter(withSuperAdmin(withMethods(['POST'], handler))))

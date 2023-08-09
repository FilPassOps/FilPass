import { findAllUsers } from 'domain/user/findAll'
import { newHandler, withSuperAdmin, withMethods } from 'lib/middleware'

async function handler(req, res) {
  const query = req.query
  const { data, error } = await findAllUsers(query)
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withSuperAdmin(withMethods(['GET'], handler)))
import { programAssociatedRequests } from 'domain/programs/programAssociatedRequests'
import { newHandler, withMethods, withSuperAdmin } from 'lib/middleware'

async function handler(req, res) {
  const id = req.query.id
  const { data, error } = await programAssociatedRequests({ programId: id })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withSuperAdmin(withMethods(['GET'], handler)))

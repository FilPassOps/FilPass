import { programAssociatedRequests } from 'domain/programs/programAssociatedRequests'
import { NextApiRequestWithSession, newHandler, withMethods, withSuperAdmin } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const id = req.query.id as number | undefined
  const { data, error } = await programAssociatedRequests({ programId: id })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withSuperAdmin(withMethods(['GET'], handler)))

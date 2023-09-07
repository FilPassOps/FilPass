import { archiveProgram, unarchiveProgram } from 'domain/programs/archiveProgram'
import { updateProgram } from 'domain/programs/updateProgram'
import { NextApiRequestWithSession, newHandler, withMethods, withSuperAdmin } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method === 'PATCH') {
    return await handlePatchRequest(req, res)
  }

  if (req.method === 'DELETE') {
    return await handleDeleteRequest(req, res)
  }
}

async function handleDeleteRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const id = req.query.id as number | undefined
  const { error, data } = await archiveProgram({ id })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

async function handlePatchRequest(req: NextApiRequestWithSession, res: NextApiResponse) {
  const id = req.query.id
  const unarchive = req?.query?.unarchive
  const superId = req.user?.id

  const action = unarchive ? unarchiveProgram : updateProgram
  const payload = unarchive ? { id } : { id, superId, ...req.body }

  const { error, data } = await action(payload)

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withSuperAdmin(withMethods(['DELETE', 'PATCH'], handler)))

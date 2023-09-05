import { findAllUsers } from 'domain/user/findAll'
import { newHandler, withSuperAdmin, withMethods, NextApiRequestWithSession } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const query = req.query
  const { data, error } = await findAllUsers(query)
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withSuperAdmin(withMethods(['GET'], handler)))
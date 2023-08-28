import { findAllWithWallets } from 'domain/user/findAllWithWallets'
import { NextApiRequestWithSession, newHandler, withAddressManager, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const query = req.query
  const { data, error } = await findAllWithWallets(query)
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withAddressManager(withMethods(['GET'], handler)))

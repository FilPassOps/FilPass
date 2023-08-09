import { findAllWithWallets } from 'domain/user/findAllWithWallets'
import { newHandler, withAddressManager, withMethods } from 'lib/middleware'

async function handler(req, res) {
  const query = req.query
  const { data, error } = await findAllWithWallets(query)
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withAddressManager(withMethods(['GET'], handler)))  

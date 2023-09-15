import { validateWalletAddress } from 'lib/filecoinShipyard'
import { NextApiRequestWithSession, newHandler, withLimiter, withMethods, withUser } from 'lib/middleware'
import { NextApiResponse } from 'next'
import errorsMessages from 'wordings-and-errors/errors-messages'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const address = req.query.address as string

  try {
    const result = await validateWalletAddress(address)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json(errorsMessages.wallet_not_found)
  }
}

export default newHandler(withLimiter(withUser(withMethods(['GET'], handler))))

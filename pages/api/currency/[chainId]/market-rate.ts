import { getCurrencyMarketRate } from 'domain/currency/getCurrencyMarketRate'
import { NextApiRequestWithSession, newHandler, withMethods, withRoles } from 'lib/middleware'
import { NextApiResponse } from 'next'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const name = req.query.name as string

  const { data, error } = await getCurrencyMarketRate({ name })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withRoles(['SUPERADMIN', 'CONTROLLER'], withMethods(['GET'], handler)))

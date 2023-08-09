import { getCurrency } from 'domain/currency/getCurrency'
import { updateCurrencyRate } from 'domain/currency/updateCurrencyRate'
import { NextApiRequestWithSession, newHandler, withLimiter, withMethods, withRoles } from 'lib/middleware'
import { NextApiResponse } from 'next'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method === 'PATCH') {
    return await handlePatchRequest(req, res)
  }

  return await handleGetRequest(req, res)
}

export default newHandler(withLimiter(withMethods(['PATCH', 'GET'], handler)))

const handlePatchRequest = withRoles(['SUPERADMIN', 'CONTROLLER'], async (req, res) => {
  const name = req.query.name

  const { data, error } = await updateCurrencyRate({ ...req.body, name })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
})

const handleGetRequest = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  const name = req.query.name as string

  const { data, error } = await getCurrency({ name })
  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

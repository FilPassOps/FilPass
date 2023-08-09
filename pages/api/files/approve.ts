import { financeUserFileReview } from 'domain/files'
import { newHandler, NextApiRequestWithSession, withFinance, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next'

interface Request extends NextApiRequestWithSession {
  body: {
    taxFormIds: number[]
  }
}
async function handler(req: Request, res: NextApiResponse) {
  const { taxFormIds } = req.body

  const financeUserRoleId = req.userRoleId

  if (!financeUserRoleId) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const { data, error } = await financeUserFileReview({ taxFormIds, financeUserRoleId, isApproved: true })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withFinance(withMethods(['POST'], handler)))

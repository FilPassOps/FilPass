import { financeUserFileReview } from 'domain/files'
import { newHandler, NextApiRequestWithSession, withFinance, withMethods } from 'lib/middleware'
import { sanitizeText } from 'lib/sanitizeText'
import { NextApiResponse } from 'next'

interface Request extends NextApiRequestWithSession {
  body: {
    taxFormIds: number[]
    rejectionReason: string
  }
}

async function handler(req: Request, res: NextApiResponse) {
  const { taxFormIds, rejectionReason } = req.body

  const financeUserRoleId = req.userRoleId

  if (!financeUserRoleId) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const sanitizedRejectionReason = sanitizeText(rejectionReason)

  const { data, error } = await financeUserFileReview({
    taxFormIds,
    financeUserRoleId,
    isApproved: false,
    rejectionReason: sanitizedRejectionReason,
  })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withFinance(withMethods(['POST'], handler)))

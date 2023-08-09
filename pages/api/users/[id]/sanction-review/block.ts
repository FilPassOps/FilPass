import { userComplianceReview } from 'domain/user/complianceUserReview'
import { newHandler, NextApiRequestWithSession, withCompliance, withMethods } from 'lib/middleware'
import { NextApiResponse } from 'next'

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const id = req.query.id
  const complianceUserRoleId = req.userRoleId

  if (!complianceUserRoleId || !id) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const { data, error } = await userComplianceReview({ id: +id, complianceUserRoleId, isSanctioned: true })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withCompliance(withMethods(['POST'], handler)))

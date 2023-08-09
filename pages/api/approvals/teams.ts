import { StatusFilterOption } from 'components/Filters/constants'
import { APPROVER_ROLE, COMPLIANCE_ROLE, VIEWER_ROLE } from 'domain/auth/constants'
import { APPROVED_STATUS, BLOCKED_STATUS } from 'domain/transferRequest/constants'
import { findComplianceTeams, findUserRoleTeams } from 'domain/transferRequest/findTeamsByRole'
import { NextApiRequestWithSession, newHandler, withMethods, withRoles } from 'lib/middleware'
import { NextApiResponse } from 'next'

const handler = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  const userId = req?.user?.id

  if (!userId) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const status = req.query?.status ?? APPROVED_STATUS

  if (status === BLOCKED_STATUS) {
    const teams = await findComplianceTeams()
    return res.status(200).json(teams)
  }

  const teams = await findUserRoleTeams(userId, status as StatusFilterOption)
  return res.status(200).json(teams)
}

export default newHandler(withRoles([APPROVER_ROLE, COMPLIANCE_ROLE, VIEWER_ROLE], withMethods(['GET'], handler)))

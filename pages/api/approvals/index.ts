import { Role } from '@prisma/client'
import { getApprovalsByRole } from 'domain/approvals/service'
import { APPROVER_ROLE, VIEWER_ROLE } from 'domain/auth/constants'
import { SUBMITTED_STATUS } from 'domain/transfer-request/constants'
import { NextApiRequestWithSession, newHandler, withMethods, withRoles } from 'lib/middleware'
import { NextApiResponse } from 'next/types'

const handler = async (req: NextApiRequestWithSession, res: NextApiResponse) => {
  const userId = req.user?.id as number
  const roles = req.user?.roles as { id: number; role: Role }[]
  const query = req.query
  const status = (query.status || SUBMITTED_STATUS) as string
  const requestNumber = query.number as string
  const team = query.team?.toString().split(',')
  const programId = query.programId as string

  const wallet = query.wallet as string | undefined

  const addresses = [wallet]

  const filteredAddresses = addresses.filter((wallet): wallet is string => !!wallet)

  let fromDate, toDate

  if (query.from && query.to) {
    fromDate = new Date(parseInt(query.from.toString()))
    fromDate.setHours(0, 0, 0, 0)
    toDate = new Date(parseInt(query.to.toString()))
    toDate.setHours(23, 59, 59, 999)
  }

  const { transfers, totalItems, error, shouldShowHeaderCheckbox } = await getApprovalsByRole({
    roles,
    userId,
    ...query,
    programId,
    status,
    requestNumber,
    team,
    from: fromDate,
    to: toDate,
    wallets: filteredAddresses,
  })

  const data = {
    transfers,
    totalItems,
    shouldShowHeaderCheckbox,
  }

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withRoles([APPROVER_ROLE, VIEWER_ROLE], withMethods(['GET'], handler)))

import { getApprovalsByRole } from 'domain/approvals/service'
import { APPROVER_ROLE, VIEWER_ROLE } from 'domain/auth/constants'
import { BLOCKED_STATUS, ON_HOLD_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { getDelegatedAddress } from 'lib/getDelegatedAddress'
import { getEthereumAddress } from 'lib/getEthereumAddress'
import { newHandler, withMethods, withRoles } from 'lib/middleware'

const handler = async (req, res) => {
  const userId = req.user.id
  const roles = req.user.roles
  const query = req.query
  const status = query.status === ON_HOLD_STATUS ? BLOCKED_STATUS : query.status || SUBMITTED_STATUS // ON_HOLD is an alias for BLOCKED
  const requestNumber = query.number
  const team = query.team?.toString().split(',')

  const wallet = query.wallet

  const ethereumWallet = getEthereumAddress(wallet)?.fullAddress.toLowerCase()
  const delegatedAddress = getDelegatedAddress(wallet)?.fullAddress

  const wallets = [wallet, ethereumWallet, delegatedAddress].filter(Boolean)

  let fromDate, toDate

  if (query.from && query.to) {
    fromDate = new Date(parseInt(query.from.toString()))
    fromDate.setHours(0, 0, 0, 0)
    toDate = new Date(parseInt(query.to.toString()))
    toDate.setHours(23, 59, 59, 999)
  }

  const { transfers, totalItems, error, tabs, shouldShowHeaderCheckbox } = await getApprovalsByRole({
    roles,
    userId,
    ...query,
    programId: query.programId?.length ? query.programId.split(',') : undefined,
    status,
    requestNumber,
    team,
    from: fromDate,
    to: toDate,
    wallets,
  })

  const data = {
    transfers,
    totalItems,
    tabs,
    shouldShowHeaderCheckbox,
  }

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withRoles([APPROVER_ROLE, VIEWER_ROLE], withMethods(['GET'], handler)))

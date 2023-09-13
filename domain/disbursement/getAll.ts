import { PAID_STATUS, REJECTED_BY_CONTROLLER_STATUS, REJECTED_STATUS } from 'domain/transferRequest/constants'
import { getDelegatedAddress } from 'lib/getDelegatedAddress'
import { getEthereumAddress } from 'lib/getEthereumAddress'
import { generateTeamHash } from 'lib/password'
import { validate } from 'lib/yup'
import { getApproved } from './getApproved'
import { getPaid } from './getPaid'
import { getRejected } from './getRejected'
import { getControllerTransferRequestsValidator } from './validation'

interface GetAllParams {
  status?: string
  networks?: string[]
  programId?: number[]
  requestNumber?: string
  wallet?: string
  team?: string[]
  from?: Date
  to?: Date
  page?: number
  size?: number
  sort?: string
  order?: string
}

interface GetInput extends GetAllParams {
  teamHashes?: string[]
  wallets?: string[]
}

export async function getAll(params: GetAllParams) {
  const { fields, errors } = await validate(getControllerTransferRequestsValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { status, team, wallet } = fields

  const teamHashes = team ? await Promise.all(team.map(team => generateTeamHash(team))) : undefined

  const ethereumWallet = getEthereumAddress(wallet)?.fullAddress.toLowerCase()
  const delegatedAddress = getDelegatedAddress(wallet)?.fullAddress

  const addresses = [wallet, ethereumWallet, delegatedAddress].filter((wallet): wallet is string => !!wallet)

  const values: GetInput = { ...fields, wallets: addresses, teamHashes }

  if (status === PAID_STATUS) {
    return await getPaid(values)
  }

  if (status === REJECTED_STATUS || status === REJECTED_BY_CONTROLLER_STATUS) {
    return await getRejected(values)
  }

  return await getApproved(values)
}

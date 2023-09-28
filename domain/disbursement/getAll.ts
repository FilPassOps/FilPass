import { PAID_STATUS, REJECTED_BY_CONTROLLER_STATUS, REJECTED_STATUS } from 'domain/transferRequest/constants'
import { WalletSize, getDelegatedAddress } from 'lib/getDelegatedAddress'
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

  const addresses = [wallet]

  // TODO: improve to get delegated address only if blockchain is Filecoin
  if (wallet?.startsWith('0x')) {
    addresses.push(getDelegatedAddress(wallet, WalletSize.FULL, 'Filecoin')?.fullAddress)
  }

  if (wallet?.startsWith('f4') || wallet?.startsWith('t4')) {
    addresses.push(getEthereumAddress(wallet, WalletSize.FULL)?.fullAddress.toLowerCase())
  }

  const filteredAddresses = addresses.filter((wallet): wallet is string => !!wallet)

  const values: GetInput = { ...fields, wallets: filteredAddresses, teamHashes }

  if (status === PAID_STATUS) {
    return await getPaid(values)
  }

  if (status === REJECTED_STATUS || status === REJECTED_BY_CONTROLLER_STATUS) {
    return await getRejected(values)
  }

  return await getApproved(values)
}

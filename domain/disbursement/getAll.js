import { PAID_STATUS, REJECTED_BY_CONTROLLER_STATUS, REJECTED_STATUS } from 'domain/transferRequest/constants'
import { generateTeamHash } from 'lib/password'
import { validate } from 'lib/yup'
import { getApproved } from './getApproved'
import { getPaid } from './getPaid'
import { getRejected } from './getRejected'
import { getControllerTransferRequestsValidator } from './validation'
import { getEthereumAddress } from 'lib/getEthereumAddress'
import { getDelegatedAddress } from 'lib/getDelegatedAddress'

export async function getAll(params) {
  const { fields, errors } = await validate(getControllerTransferRequestsValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { status, team, wallet } = fields

  fields.teamHashes = team ? await Promise.all(team.map(team => generateTeamHash(team))) : undefined

  const ethereumWallet = getEthereumAddress(wallet)?.fullAddress.toLowerCase()
  const delegatedAddress = getDelegatedAddress(wallet)?.fullAddress

  const addresses = [wallet, ethereumWallet, delegatedAddress].filter(Boolean)

  fields.wallets = addresses

  if (status === PAID_STATUS) {
    return await getPaid(fields)
  }

  if (status === REJECTED_STATUS || status === REJECTED_BY_CONTROLLER_STATUS) {
    return await getRejected(fields)
  }

  return await getApproved(fields)
}

import { TransferRequestStatus } from '@prisma/client'
import { VIEWER_ROLE } from 'domain/auth/constants'
import prisma from 'lib/prisma'
import { shortenAddress } from 'lib/shortenAddress'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { getTransferRequestById } from './getTransferRequestById'
import { getUserTransferRequestByIdValidator } from './validation'
import { getDelegatedAddress } from 'lib/getDelegatedAddress'
import { WalletSize } from 'components/web3/useDelegatedAddress'

interface GetViewerTransferRequestByIdParams {
  transferRequestId: string
  userId: number
  status?: TransferRequestStatus
}

interface CountResult {
  total: number
}

export async function getViewerTransferRequestById(params: GetViewerTransferRequestByIdParams) {
  const { fields, errors } = await validate(getUserTransferRequestByIdValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
      data: undefined,
    }
  }

  const { transferRequestId, userId, status } = fields
  const [transferRequestsMatches] = await prisma.$queryRaw<CountResult[]>`
    SELECT
      SUM(1) total
    FROM user_role
    INNER JOIN user_role_program ON user_role_program.user_role_id = user_role.id AND user_role_program.is_active = TRUE
    INNER JOIN transfer_request ON transfer_request.program_id = user_role_program.program_id
      AND transfer_request.is_active = TRUE
      AND transfer_request.public_id = ${transferRequestId}
      AND transfer_request.status::text = ${status}
    WHERE user_role.is_active = TRUE
    AND user_role.user_id = ${userId}
    AND user_role.role::text = ${VIEWER_ROLE}
  `

  if (transferRequestsMatches.total < 1) {
    return {
      error: {
        status: 404,
        message: errorsMessages.not_found.message,
      },
      data: undefined,
    }
  }

  const { data: tr, error } = await getTransferRequestById({ transferRequestId })

  if (error) {
    return { error }
  }

  return {
    data: {
      ...tr,
      delegated_address: getDelegatedAddress(tr.wallet_address, WalletSize.VERY_SHORT)?.shortAddress,
      wallet_address: shortenAddress(tr.wallet_address),
    },
  }
}

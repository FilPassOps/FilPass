import prisma from 'lib/prisma'
import { shortenAddress } from 'lib/shortenAddress'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { getTransferRequestById } from './getTransferRequestById'
import { getUserTransferRequestByIdValidator } from './validation'

interface GetUserTransferRequestByIdParams {
  transferRequestId: string
  userId: number
  status?: string
}

interface TransferRequestMatchResult {
  total: number
}

interface TransferRequestDraftMatchResult {
  total: number
}

export async function getApproverTransferRequestById(params: GetUserTransferRequestByIdParams) {
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

  const { transferRequestId, userId } = fields

  const [transferRequestsMatches] = await prisma.$queryRaw<TransferRequestMatchResult[]>`
    SELECT
      SUM(1) total
    FROM user_role
    INNER JOIN user_role_program ON user_role_program.user_role_id = user_role.id AND user_role_program.is_active = TRUE
    INNER JOIN transfer_request ON transfer_request.program_id = user_role_program.program_id
      AND transfer_request.is_active = TRUE
      AND transfer_request.public_id = ${transferRequestId}
    WHERE user_role.is_active = TRUE
    AND user_role.role::text = 'APPROVER'
    AND user_role.user_id = ${userId}
  `
  const [draftMatches] = await prisma.$queryRaw<TransferRequestDraftMatchResult[]>`
    SELECT
      SUM(1) total
    FROM user_role
    INNER JOIN user_role_program ON user_role_program.user_role_id = user_role.id AND user_role_program.is_active = TRUE
    INNER JOIN transfer_request_draft ON transfer_request_draft.program_id = user_role_program.program_id
      AND transfer_request_draft.is_active = TRUE
      AND transfer_request_draft.public_id = ${transferRequestId}
    WHERE user_role.is_active = TRUE
    AND user_role.role::text = 'APPROVER'
    AND user_role.user_id = ${userId}
  `

  if (transferRequestsMatches.total < 1 && draftMatches.total < 1) {
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
      wallet_address: tr.wallet_address ? shortenAddress(tr.wallet_address, 'very-short') : undefined,
    },
  }
}

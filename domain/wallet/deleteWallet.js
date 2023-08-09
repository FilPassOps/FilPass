import {
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_BY_APPROVER_STATUS,
  SUBMITTED_STATUS,
} from 'domain/transferRequest/constants'
import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import { deleteWalletValidator } from './validation'
import * as deleteWalletModule from 'domain/wallet/deleteWallet'
import errorsMessages from 'wordings-and-errors/errors-messages'

export async function deleteWallet(params) {
  const { fields, errors } = await validate(deleteWalletValidator, params)

  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { id, userId } = fields
  const prisma = await getPrismaClient()

  const walletTransferRequestError = await deleteWalletModule.validateWalletTransferRequests(
    prisma,
    userId,
    id
  )
  if (walletTransferRequestError) {
    return {
      error: {
        status: 400,
        message: walletTransferRequestError,
      },
    }
  }

  const deletedWallet = await prisma.userWallet.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      isActive: false,
    },
  })

  return {
    data: deletedWallet,
  }
}

export async function validateWalletTransferRequests(prisma, userId, userWalletId) {
  const walletTransferRequests = await prisma.transferRequest.findMany({
    where: {
      userWalletId,
      receiverId: userId,
      status: {
        in: [SUBMITTED_STATUS, SUBMITTED_BY_APPROVER_STATUS, REQUIRES_CHANGES_STATUS],
      },
    },
    select: {
      publicId: true,
    },
  })

  if (walletTransferRequests.length <= 0) {
    return
  }

  const transferRequestIds = walletTransferRequests.map((transferRequest) => transferRequest.publicId)

  return errorsMessages.wallet_has_active_transfer_request.message(transferRequestIds)
}

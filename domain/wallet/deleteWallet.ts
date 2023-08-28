import { REQUIRES_CHANGES_STATUS, SUBMITTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { deleteWalletValidator } from './validation'
import * as deleteWalletModule from 'domain/wallet/deleteWallet'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { Prisma } from '@prisma/client'

interface DeleteWalletParams {
  id?: number
  userId?: number
}

interface ValidateWalletTransferRequestsParams {
  prisma: Prisma.TransactionClient
  userId: number
  userWalletId: number
}

export async function deleteWallet(params: DeleteWalletParams) {
  const { fields, errors } = await validate(deleteWalletValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { id, userId } = fields

  const walletTransferRequestError = await deleteWalletModule.validateWalletTransferRequests({ prisma, userId, userWalletId: id })
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

export async function validateWalletTransferRequests({ prisma, userId, userWalletId }: ValidateWalletTransferRequestsParams) {
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

  const transferRequestIds = walletTransferRequests.map(transferRequest => transferRequest.publicId)

  return errorsMessages.wallet_has_active_transfer_request.message(transferRequestIds)
}

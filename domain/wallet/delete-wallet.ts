import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { deleteWalletValidator } from './validation'

interface DeleteWalletParams {
  id?: number
  userId?: number
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

  // TODO: validate if the wallet is tied to any existing storage provider credit

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

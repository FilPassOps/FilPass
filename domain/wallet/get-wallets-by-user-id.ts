import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { getWalletsByUserIdValidator } from './validation'

interface GetWalletsByUserIdProps {
  userId: number
}

export const getWalletsByUserId = async (props: GetWalletsByUserIdProps) => {
  const { fields, errors } = await validate(getWalletsByUserIdValidator, props)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { userId } = fields

  const wallets = await prisma.userWallet.findMany({
    where: {
      userId,
    },
  })

  return {
    data: wallets,
  }
}

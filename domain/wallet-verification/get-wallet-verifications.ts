import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { getWalletVerificationsValidator } from './validation'

interface GetWalletVerificationsParams {
  address?: string
  userId?: number
}

export async function getWalletVerifications(params: GetWalletVerificationsParams) {
  const { fields, errors } = await validate(getWalletVerificationsValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { address, userId } = fields

  const verification = await prisma.walletVerification.findFirst({
    where: {
      address,
      userId,
      isActive: true,
    },
    select: {
      id: true,
      address: true,
      isVerified: true,
    },
  })

  return {
    data: verification,
  }
}

import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import { getWalletVerificationsValidator } from './validation'

export async function getWalletVerifications(params) {
  const { fields, errors } = await validate(getWalletVerificationsValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { address, userId } = fields
  const prisma = await getPrismaClient()

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
      transactionAmount: true,
    },
  })

  return {
    data: verification,
  }
}

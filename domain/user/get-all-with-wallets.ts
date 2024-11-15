import { decryptPII } from 'lib/crypto'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { findAllWithWalletValidator } from './validation'

interface FindAllWithWalletsParams {
  size?: number
  page?: number
}

export async function getAllWithWallets(params: FindAllWithWalletsParams) {
  const { errors } = await validate(findAllWithWalletValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }
  const { size = 100, page = 1 } = params

  const currentPage = page - 1 < 0 ? 0 : page - 1

  const data = await prisma.userWallet.findMany({
    where: { isActive: true, user: { isActive: true } },
    select: {
      id: true,
      address: true,
      blockchain: true,
      verificationId: true,
      createdAt: true,
      updatedAt: true,
      verification: {
        select: {
          isVerified: true,
        },
      },
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    skip: size * currentPage,
    take: Number(size),
  })

  const total = await prisma.userWallet.count({
    where: { isActive: true, user: { isActive: true } },
  })

  const descryptedData = await Promise.all(data.map(async ({ user, ...w }) => ({ ...w, user: { email: await decryptPII(user.email) } })))

  return {
    data: {
      wallets: descryptedData,
      total,
    },
  }
}

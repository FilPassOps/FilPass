import prisma from 'lib/prisma'
import { getUserCreditsValidator } from './validation'

interface GetUserCreditsParams {
  userId: number
  size: number
  page: number
}

export const getUserCredits = async (props: GetUserCreditsParams) => {
  try {
    const fields = await getUserCreditsValidator.validate(props)

    const currentPage = fields.page - 1 < 0 ? 0 : fields.page - 1

    const userCredit = await prisma.userCredit.findMany({
      where: {
        userId: fields.userId,
        creditTransactions: {
          some: {
            status: 'SUCCESS',
          },
        },
      },
      select: {
        id: true,
        totalHeight: true,
        totalWithdrawals: true,
        totalRefunds: true,
        updatedAt: true,
        refundStartsAt: true,
        withdrawExpiresAt: true,
        withdrawStartsAt: true,
        amount: true,
        creditTransactions: {
          select: {
            id: true,
            storageProvider: {
              select: {
                walletAddress: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: fields.size,
      skip: fields.size * currentPage,
    })

    const total = await prisma.userCredit.count({
      where: {
        userId: fields.userId,
        creditTransactions: {
          some: {
            status: 'SUCCESS',
          },
        },
      },
    })

    const userCreditItems = userCredit.map(item => {
      return {
        ...item,
        isWithdrawExpired: item.withdrawExpiresAt && item.withdrawExpiresAt < new Date(),
        isRefundStarted: item.refundStartsAt && item.refundStartsAt < new Date(),
      }
    })

    return { data: { userCredit: userCreditItems, total } }
  } catch (error) {
    console.log('Error creating comment', error)
    return { error: 'Something went wrong' }
  }
}

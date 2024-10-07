import prisma from 'lib/prisma'
import { getUserCreditByIdValidator } from './validation'

interface GetUserCreditByIdParams {
  id: number
  userId: number
}

export const getUserCreditById = async (props: GetUserCreditByIdParams) => {
  try {
    const fields = await getUserCreditByIdValidator.validate(props)

    const userCredit = await prisma.userCredit.findUnique({
      where: {
        id: fields.id,
        userId: fields.userId,
      },
      select: {
        id: true,
        totalHeight: true,
        totalRefunds: true,
        totalWithdrawals: true,
        updatedAt: true,
        withdrawStartsAt: true,
        withdrawExpiresAt: true,
        refundStartsAt: true,
        amount: true,
        currentToken: {
          select: {
            token: true,
            height: true,
          },
        },
        creditTransactions: {
          select: {
            id: true,
            storageProvider: {
              select: {
                walletAddress: true,
              },
            },
            status: true,
            transactionHash: true,
          },
        },
      },
    })
    return { data: userCredit }
  } catch (error) {
    console.log('Error creating comment', error)
    return { error: 'Something went wrong' }
  }
}

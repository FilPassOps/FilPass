import prisma from 'lib/prisma'
import { getUserTransactionCreditsByUserIdValidator } from './validation'

interface GetUserTransactionCreditsByUserIdParams {
  userId: number
}

export const getUserTransactionCreditsByUserId = async (props: GetUserTransactionCreditsByUserIdParams) => {
  try {
    const fields = await getUserTransactionCreditsByUserIdValidator.validate(props)

    // TODO: encrypt amount and other important info
    const creditTransaction = await prisma.creditTransaction.findMany({
      where: {
        userCredit: {
          userId: fields.userId,
        },
      },
      select: {
        id: true,
        status: true,
        transactionHash: true,
        storageProvider: {
          select: {
            walletAddress: true,
          },
        },
        createdAt: true,
        userCredit: {
          select: {
            withdrawExpiresAt: true,
            amount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { data: creditTransaction }
  } catch (error) {
    console.log('Error creating comment', error)
    return { error: 'Something went wrong' }
  }
}

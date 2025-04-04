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
        totalSubmitTicket: true,
        updatedAt: true,
        submitTicketStartsAt: true,
        submitTicketExpiresAt: true,
        refundStartsAt: true,
        amount: true,
        contract: {
          select: {
            address: true,
            deployedFromAddress: true,
          },
        },
        receiver: {
          select: {
            walletAddress: true,
          },
        },
        creditTransactions: {
          select: {
            id: true,
            receiver: {
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

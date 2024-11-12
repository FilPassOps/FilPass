import prisma from 'lib/prisma'
import { getUserCreditByReceiverWalletValidator } from './validation'

interface GetUserCreditByReceiverWalletParams {
  receiverWallet: string
  userId: number
}

export const getUserCreditByReceiverWallet = async (props: GetUserCreditByReceiverWalletParams) => {
  try {
    const fields = await getUserCreditByReceiverWalletValidator.validate(props)

    const userCredit = await prisma.userCredit.findFirst({
      where: {
        receiver: {
          walletAddress: fields.receiverWallet.toLowerCase(),
        },
        userId: fields.userId,
      },
      select: {
        id: true,
        totalHeight: true,
        totalRefunds: true,
        totalSubmitTicket: true,
        refundStartsAt: true,
      },
    })

    return userCredit
  } catch (error) {
    console.log('Error creating comment', error)
    return { error: 'Something went wrong' }
  }
}

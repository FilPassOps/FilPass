import prisma from 'lib/prisma'
import { refundCreditsValidator } from './validation'
import { ethers } from 'ethers'
import { logger } from 'lib/logger'
import { TransactionStatus } from '@prisma/client'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface RefundCreditsParams {
  id: number
  userId: number
}

export const refundCredits = async (props: RefundCreditsParams) => {
  try {
    const fields = await refundCreditsValidator.validate(props)

    await prisma.$transaction(async tx => {
      const userCredit = await prisma.userCredit.findUnique({
        where: {
          id: fields.id,
          userId: fields.userId,
        },
      })

      if (!userCredit) {
        throw new Error('User credit not found')
      }

      if (userCredit.refundStartsAt && userCredit.refundStartsAt > new Date()) {
        throw new Error('Refund not started')
      }

      if (!userCredit.totalHeight) {
        throw new Error('Internal error')
      }

      const currentHeight = ethers.BigNumber.from(userCredit.totalRefunds).add(userCredit.totalSubmitTicket)
      const totalHeight = ethers.BigNumber.from(userCredit.totalHeight)
      const remainCredits = totalHeight.sub(currentHeight)

      await tx.refundTransaction.create({
        data: {
          transactionHash: fields.hash,
          status: TransactionStatus.PENDING,
          amount: remainCredits.toString(),
          userCreditId: userCredit.id,
        },
      })
    })

    return { message: 'Success' }
  } catch (error) {
    logger.error('Error refunding credits', error)
    return { error: errorsMessages.something_went_wrong.message }
  }
}

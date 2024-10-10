import prisma from 'lib/prisma'
import { refundCreditsValidator } from './validation'
import { ethers } from 'ethers'
import { logger } from 'lib/logger'

interface RefundCreditsParams {
  id: number
  userId: number
}

export const refundCredits = async (props: RefundCreditsParams) => {
  try {
    const fields = await refundCreditsValidator.validate(props)

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

    const currentHeight = ethers.BigNumber.from(userCredit.totalRefunds).add(userCredit.totalWithdrawals)
    const totalHeight = ethers.BigNumber.from(userCredit.totalHeight)

    if (currentHeight.gte(totalHeight)) {
      throw new Error('All credits already used or refunded')
    }

    const remainCredits = totalHeight.sub(currentHeight)

    const totalRefunds = remainCredits.add(userCredit.totalRefunds).toString()

    await prisma.$transaction(async tx => {
      await tx.userCredit.update({
        where: {
          id: userCredit.id,
        },
        data: {
          totalRefunds,
        },
      })

      await tx.refundCreditsRequest.create({
        data: {
          amount: totalRefunds,
          userCreditId: userCredit.id,
        },
      })
    })

    return { message: 'Success' }
  } catch (error) {
    logger.error('Error refunding credits', error)
    return { error: 'Something went wrong' }
  }
}

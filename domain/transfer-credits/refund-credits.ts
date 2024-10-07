import prisma from 'lib/prisma'
import { refundCreditsValidator } from './validation'
import Big from 'big.js'

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

    const currentHeight = Big(userCredit.totalRefunds).plus(userCredit.totalWithdrawals)

    if (!userCredit.totalHeight) {
      throw new Error('Internal error')
    }

    if (Big(userCredit.totalHeight).lte(currentHeight)) {
      throw new Error('All credits already used or refunded')
    }

    const remainCredits = Big(userCredit.totalHeight).minus(currentHeight)

    const totalRefunds = Big(userCredit.totalRefunds).plus(remainCredits).toString()

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
    console.log('Error creating comment', error)
    return { error: 'Something went wrong' }
  }
}

import prisma from 'lib/prisma'
import { verifyJwt } from 'lib/jwt'
import { redeemTokenValidator } from './validation'
import { logger } from 'lib/logger'
import { ethers } from 'ethers'

interface RedeemTokenParams {
  walletAddress: string
  token: string
}

export const redeemToken = async (props: RedeemTokenParams) => {
  try {
    const fields = await redeemTokenValidator.validate(props)

    const result = await verifyJwt(fields.token, process.env.SYSTEM_WALLET_ADDRESS as string)

    if (result.error) {
      throw new Error('Invalid token ')
    }

    const { sub, height } = result.data

    if (ethers.BigNumber.from(height).isZero()) {
      throw new Error('Invalid token')
    }

    const creditToken = await prisma.creditToken.findUnique({
      include: {
        userCredit: true,
      },
      where: {
        publicId: sub,
      },
    })

    if (!creditToken) {
      throw new Error('Credit token not found')
    }

    if (!creditToken.redeemable) {
      throw new Error('Credit token already redeemed')
    }

    if (creditToken.userCredit.withdrawExpiresAt! < new Date()) {
      throw new Error('Withdrawal expired')
    }

    const lastTokenWithdrawal = await prisma.redeemTokenRequest.findFirst({
      select: {
        creditToken: {
          select: {
            height: true,
          },
        },
      },
      where: {
        creditToken: {
          userCreditId: creditToken.userCreditId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (lastTokenWithdrawal) {
      const lastTokenWithdrawalHeight = ethers.BigNumber.from(lastTokenWithdrawal?.creditToken.height)

      if (lastTokenWithdrawalHeight.gte(creditToken.height)) {
        throw new Error('A bigger token was already redeemed')
      }
    }

    const storageProvider = await prisma.storageProvider.findUnique({
      where: {
        walletAddress: fields.walletAddress,
      },
    })

    if (!storageProvider) {
      throw new Error('Storage provider not found')
    }

    const totalWithdrawalsHeight = ethers.BigNumber.from(creditToken.userCredit.totalWithdrawals).add(creditToken.height)

    if (totalWithdrawalsHeight.gt(creditToken.userCredit.totalHeight!)) {
      logger.error('Total withdrawals is greater than total height ', {
        totalWithdrawalsHeight,
        totalHeight: creditToken.userCredit.totalHeight,
      })
      throw new Error('Something went wrong. Please contact support')
    }

    await prisma.$transaction(async tx => {
      await tx.creditToken.update({
        where: {
          id: creditToken.id,
        },
        data: {
          redeemable: false,
        },
      })

      if (totalWithdrawalsHeight) {
        await tx.userCredit.update({
          where: {
            id: creditToken.userCreditId,
          },
          data: {
            totalWithdrawals: totalWithdrawalsHeight.toString(),
          },
        })
      }

      await tx.redeemTokenRequest.create({
        data: {
          creditTokenId: creditToken.id,
          storageProviderId: storageProvider.id,
        },
      })
    })

    return { message: 'Success' }
  } catch (error) {
    console.log('Error creating comment', error)
    return { error: 'Something went wrong' }
  }
}

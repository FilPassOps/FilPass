import prisma from 'lib/prisma'
import { verifyJwt } from 'lib/jwt'
import { redeemTokenValidator } from './validation'
import Big from 'big.js'

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

    const { exp, sub, height } = result.data

    // TODO: Even if token is expired we need to check in the database because the date could have changed
    // if (new Date(exp * 1000) < new Date()) {
    //   throw new Error('Token expired')
    // }

    if (height <= 0) {
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

    const storageProvider = await prisma.storageProvider.findUnique({
      where: {
        walletAddress: fields.walletAddress,
      },
    })

    if (!storageProvider) {
      throw new Error('Storage provider not found')
    }

    const totalWithdrawals = Big(creditToken.userCredit.totalWithdrawals).plus(creditToken.height).toString()

    await prisma.$transaction(async tx => {
      await tx.creditToken.update({
        where: {
          id: creditToken.id,
        },
        data: {
          redeemable: false,
        },
      })

      if (totalWithdrawals) {
        await tx.userCredit.update({
          where: {
            id: creditToken.userCreditId,
          },
          data: {
            totalWithdrawals,
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

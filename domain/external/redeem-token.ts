import prisma from 'lib/prisma'
import { verify } from 'lib/jwt'
import { redeemTokenValidator } from './validation'
import Big from 'big.js'

interface RedeemTokenParams {
  walletAddress: string
  token: string
}

export const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo
4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u
+qKhbwKfBstIs+bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyeh
kd3qqGElvW/VDL5AaWTg0nLVkjRo9z+40RQzuVaE8AkAFmxZzow3x+VJYKdjykkJ
0iT9wCS0DRTXu269V264Vf/3jvredZiKRkgwlL9xNAwxXFg0x/XFw005UWVRIkdg
cKWTjpBP2dPwVZ4WWC+9aGVd+Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbc
mwIDAQAB
-----END PUBLIC KEY-----`

export const redeemToken = async (props: RedeemTokenParams) => {
  try {
    const fields = await redeemTokenValidator.validate(props)

    const { data: decodedToken, error } = verify(fields.token, PUBLIC_KEY)

    if (error) {
      throw new Error('Invalid token')
    }

    const { exp, sub, height } = decodedToken

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

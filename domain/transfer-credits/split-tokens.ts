import prisma from 'lib/prisma'
import { getUserCreditById } from './get-user-credit-by-id'
import { splitCreditsValidator } from './validation'
import { signJwt } from 'lib/jwt'
import { randomUUID } from 'node:crypto'
import { ethers } from 'ethers'
import { logger } from 'lib/logger'

interface SplitTokensParams {
  id: number
  userId: number
  splitNumber: number
}

export const splitTokens = async (props: SplitTokensParams) => {
  try {
    const fields = await splitCreditsValidator.validate(props)

    const { data, error } = await getUserCreditById({ id: fields.id, userId: fields.userId })

    if (!data || error || !data.totalRefunds || !data.totalWithdrawals || !data.withdrawExpiresAt || !data.totalHeight) {
      throw new Error('User credit not found')
    }

    if (data.withdrawExpiresAt < new Date()) {
      throw new Error('Withdrawal expired')
    }

    // TODO: check if the user has enough balance to split

    const splitGroup = randomUUID()

    const currentHeight = ethers.BigNumber.from(data.totalWithdrawals).add(data.totalRefunds)
    const totalHeight = ethers.BigNumber.from(data.totalHeight!)

    const remaining = totalHeight.sub(currentHeight)

    const balancePerSplit = remaining.div(fields.splitNumber)

    const splits = await Promise.all(
      Array(fields.splitNumber)
        .fill(null)
        .map(async (_, index) => {
          const splitHeight = balancePerSplit
            .mul(index + 1)
            .add(currentHeight)
            .toString()

          const tokenUuid = randomUUID()

          return {
            userCreditId: data.id,
            height: splitHeight,
            amount: balancePerSplit.toString(),
            publicId: tokenUuid,
            splitGroup,
            token: await signJwt({
              iss: process.env.SYSTEM_WALLET_ADDRESS,
              exp: data.withdrawExpiresAt?.getTime(),
              iat: Math.floor(Date.now() / 1000),
              sub: tokenUuid,
              height: splitHeight,
            }),
          }
        }),
    )

    const splitCredits = await prisma.creditToken.createMany({
      data: splits,
    })

    return splitCredits
  } catch (error) {
    logger.error('Error splitting tokens', error)
    throw error
  }
}

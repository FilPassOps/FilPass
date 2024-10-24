import prisma from 'lib/prisma'
import { getUserCreditById } from './get-user-credit-by-id'
import { splitCreditsValidator } from './validation'
import { sign } from 'lib/jwt'
import { randomUUID } from 'node:crypto'
import { ethers } from 'ethers'
import { logger } from 'lib/logger'

const ONE_HOUR_TIME = 1 * 60 * 60 * 1000

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

    if (!data.contract) {
      throw new Error('Contract not found')
    }

    // TODO: check if the user has enough balance to split

    const splitGroup = randomUUID()

    const currentHeight = ethers.BigNumber.from(data.totalWithdrawals).add(data.totalRefunds)
    const totalHeight = ethers.BigNumber.from(data.totalHeight!)

    const remaining = totalHeight.sub(currentHeight)

    const balancePerSplit = remaining.div(fields.splitNumber)

    const expirationDateTime = new Date(data.withdrawExpiresAt.getTime() - ONE_HOUR_TIME).getTime()
    const issuedAt = Math.floor(Date.now() / 1000)

    const splits = await Promise.all(
      Array(fields.splitNumber)
        .fill(null)
        .map(async (_, index) => {
          const splitHeight = balancePerSplit
            .mul(index + 1)
            .add(currentHeight)
            .toString()

          // TODO: change it to guarantee uniqueness
          const tokenUuid = randomUUID()

          return {
            userCreditId: data.id,
            height: splitHeight,
            amount: balancePerSplit.toString(),
            publicId: tokenUuid,
            splitGroup,
            token: sign(
              {
                iss: `${process.env.NEXT_PUBLIC_APP_URL}/.well-known/jwks.json`,
                jti: tokenUuid,
                exp: expirationDateTime,
                iat: issuedAt,
                voucher_type: 'filpass',
                voucher_version: '1',
                funder: data.contract.deployedFromAddress,
                sub: data.contract.address,
                aud: data.storageProvider.walletAddress,
                voucher_lane: 0,
                lane_total_amount: splitHeight,
                lane_guaranteed_amount: balancePerSplit.toString(),
                lane_guaranteed_until: data.withdrawExpiresAt?.getTime(),
              },
              process.env.PRIVATE_KEY as string,
              {
                keyid: '1234',
                algorithm: 'RS256',
              },
            ),
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

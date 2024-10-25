import prisma from 'lib/prisma'
import { getUserCreditById } from './get-user-credit-by-id'
import { splitCreditsValidator } from './validation'
import { sign } from 'lib/jwt'
import { ethers } from 'ethers'
import { logger } from 'lib/logger'
import { getAvailableTokenNumber } from './get-available-token-number'
import { FIL, MIN_CREDIT_PER_VOUCHER } from './constants'
import { v1 as uuidv1 } from 'uuid'
import { parseUnits } from 'ethers/lib/utils'
import { AppConfig } from 'config/system'

const ONE_HOUR_TIME = 1 * 60 * 60 * 1000

interface SplitTokensParams {
  id: number
  userId: number
  splitNumber: number
  creditPerVoucher: number
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

    const fil = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')

    if (!fil) {
      throw new Error('FIL token not found')
    }

    const currentHeight = ethers.BigNumber.from(data.totalWithdrawals).add(data.totalRefunds)
    const totalHeight = ethers.BigNumber.from(data.totalHeight!)
    const remaining = totalHeight.sub(currentHeight)
    const creditPerVoucher = parseUnits(fields.creditPerVoucher.toString(), FIL.decimals)

    const { data: availableTokenNumber } = await getAvailableTokenNumber({ userId: fields.userId, userCreditId: data.id })

    if (availableTokenNumber < fields.splitNumber) {
      throw new Error('Not enough available vouchers')
    }

    if (creditPerVoucher.lt(MIN_CREDIT_PER_VOUCHER)) {
      throw new Error('Credit per voucher is too low')
    }

    if (creditPerVoucher.gt(remaining)) {
      throw new Error('Credit per voucher cannot exceed available credits')
    }

    if (ethers.BigNumber.from(fields.splitNumber).mul(creditPerVoucher).gt(remaining)) {
      throw new Error('Total credits exceed available credits')
    }

    const expirationDateTime = new Date(data.withdrawExpiresAt.getTime() - ONE_HOUR_TIME).getTime()
    const issuedAt = Math.floor(Date.now() / 1000)

    const splitGroup = await prisma.splitGroup.create({
      data: {
        userCreditId: data.id,
      },
    })

    const creditPerVoucherAmount = parseUnits(fields.creditPerVoucher.toString(), fil.decimals)

    const splits = Array(fields.splitNumber)
      .fill(null)
      .map((_, index) => {
        const splitHeight = creditPerVoucherAmount
          .mul(index + 1)
          .add(currentHeight)
          .toString()

        const publicId = uuidv1()

        return {
          splitGroupId: splitGroup.id,
          height: splitHeight,
          amount: creditPerVoucherAmount.toString(),
          publicId,
          token: sign(
            {
              iss: `${process.env.NEXT_PUBLIC_APP_URL}/.well-known/jwks.json`,
              jti: publicId,
              exp: expirationDateTime,
              iat: issuedAt,
              voucher_type: 'filpass',
              voucher_version: '1',
              funder: data.contract.deployedFromAddress,
              sub: data.contract.address,
              aud: data.storageProvider.walletAddress,
              voucher_lane: 0,
              lane_total_amount: remaining.toString(),
              lane_guaranteed_amount: creditPerVoucherAmount.toString(),
              lane_guaranteed_until: data.withdrawExpiresAt?.getTime(),
            },
            process.env.PRIVATE_KEY as string,
            {
              keyid: '1234',
              algorithm: 'RS256',
            },
          ),
        }
      })

    const splitCredits = await prisma.creditToken.createMany({
      data: splits,
    })

    return splitCredits
  } catch (error) {
    logger.error('Error splitting tokens', error)
    throw error
  }
}

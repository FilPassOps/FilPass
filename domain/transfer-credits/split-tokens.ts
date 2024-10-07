import prisma from 'lib/prisma'
import { getUserCreditById } from './get-user-credit-by-id'
import { splitCreditsValidator } from './validation'
import { signEthereumJWT } from 'lib/jwt'
import { randomUUID } from 'node:crypto'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { AppConfig } from 'config/system'
import Big from 'big.js'

interface SplitTokensParams {
  id: number
  userId: number
  splitNumber: number
}

export const splitTokens = async (props: SplitTokensParams) => {
  try {
    const fil = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')

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

    const currentHeight = Big(data.totalWithdrawals).plus(data.totalRefunds).toString()

    const parsedCurrentHeight = parseUnits(currentHeight, fil.decimals)
    const parsedTotalHeight = parseUnits(data.totalHeight!, fil.decimals)

    const remaining = parsedTotalHeight.sub(parsedCurrentHeight)

    const balancePerSplit = remaining.div(fields.splitNumber)

    const splits = await Promise.all(
      Array(fields.splitNumber)
        .fill(null)
        .map(async (_, index) => {
          const splitHeight = balancePerSplit
            .mul(index + 1)
            .add(parsedCurrentHeight)
            .toString()

          const tokenUuid = randomUUID()

          const height = formatUnits(splitHeight, fil.decimals)
          const amount = formatUnits(balancePerSplit, fil.decimals)

          return {
            userCreditId: data.id,
            height,
            amount,
            publicId: tokenUuid,
            splitGroup,
            token: await signEthereumJWT({
              iss: process.env.SYSTEM_WALLET_ADDRESS,
              exp: data.withdrawExpiresAt?.getTime(),
              iat: Math.floor(Date.now() / 1000),
              sub: tokenUuid,
              height: height,
              splitGroup,
              systemWallet: process.env.SYSTEM_WALLET_ADDRESS,
            }),
          }
        }),
    )

    const splitCredits = await prisma.creditToken.createMany({
      data: splits,
    })

    return splitCredits
  } catch (error) {
    console.log(error)
    throw error
  }
}

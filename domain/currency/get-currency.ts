import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { getCurrencyRateValidator } from './validation'
import { AppConfig } from 'config/index'

interface GetCurrencyParams {
  tokenIdentifier: string
}

export async function getCurrency(params: GetCurrencyParams) {
  const { fields, errors } = await validate(getCurrencyRateValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { tokenIdentifier } = fields

  const token = AppConfig.network.getTokenByIdentifier(tokenIdentifier)

  if (!token) {
    return {
      error: {
        status: 400,
        errors: {
          tokenIdentifier: 'Token not found',
        },
      },
    }
  }

  const chain = AppConfig.network.getChainByToken(token)

  const blockchain = await prisma.blockchain.findUnique({
    where: { chainId: chain?.chainId },
  })

  const [currencyRate] = await prisma.currency.findMany({
    where: { blockchainId: blockchain?.id, name: token.symbol, isActive: true },
    select: {
      id: true,
      name: true,
      rate: true,
      isActive: true,
      updatedAt: true,
    },
  })

  return {
    data: currencyRate,
  }
}

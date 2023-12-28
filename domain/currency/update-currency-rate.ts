import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { updateCurrencyRateValidator } from './validation'
import { AppConfig } from 'config/index'

interface UpdateCurrencyRateParams {
  name: string
  rate: number
}

export async function updateCurrencyRate(params: UpdateCurrencyRateParams) {
  const { fields, errors } = await validate(updateCurrencyRateValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { rate, tokenIdentifier } = fields

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

  const updatedRate = await prisma.currency.update({
    where: { blockchainId: blockchain?.id, name: token.symbol, isActive: true },
    data: {
      rate: rate.toString().match(/^-?\d+(?:\.\d{0,2})?/)?.[0] || '0',
    },
    select: {
      rate: true,
    },
  })

  return {
    data: updatedRate,
  }
}

import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { updateCurrencyRateValidator } from './validation'

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

  const { rate, chainId } = fields

  const blockchain = await prisma.blockchain.findUnique({
    where: { chainId },
  })

  const updatedRate = await prisma.currency.update({
    where: { id: blockchain?.currencyId, isActive: true },
    data: {
      rate: rate.toString().match(/^-?\d+(?:\.\d{0,2})?/)?.[0] || '0',
    },
    select: {
      rate: true,
    }
  })

  return {
    data: updatedRate,
  }
}

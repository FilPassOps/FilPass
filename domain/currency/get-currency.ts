import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { getCurrencyRateValidator } from './validation'

interface GetCurrencyParams {
  chainId: string
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

  const { chainId } = fields

  const blockchain = await prisma.blockchain.findUnique({
    where: { chainId },
  })


  const [currencyRate] = await prisma.currency.findMany({
    where: { id: blockchain?.currencyId, isActive: true },
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

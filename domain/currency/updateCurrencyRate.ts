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

  const { rate, name } = fields

  const updatedRate = await prisma.currency.updateMany({
    where: { name, isActive: true },
    data: {
      rate: rate.toString().match(/^-?\d+(?:\.\d{0,2})?/)?.[0] || '0',
    },
  })

  return {
    data: updatedRate,
  }
}

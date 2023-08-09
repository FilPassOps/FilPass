import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import { scriptTransactionsValidator } from './validation'

export async function scriptTransactions(params) {
  const { fields, errors } = await validate(scriptTransactionsValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transactions } = fields

  const prisma = await getPrismaClient()

  const data = await prisma.scriptTransaction.createMany({
    data: transactions.map((transaction) => ({ transaction })),
    skipDuplicates: true,
  })

  return {
    data,
  }
}

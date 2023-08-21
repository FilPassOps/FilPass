import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { scriptTransactionsValidator } from './validation'

interface ScriptTransactionParams {
  transactions: string[]
}

export async function scriptTransactions(params: ScriptTransactionParams) {
  const { fields, errors } = await validate(scriptTransactionsValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transactions } = fields

  const data = await prisma.scriptTransaction.createMany({
    data: transactions.map(transaction => ({ transaction })),
    skipDuplicates: true,
  })

  return {
    data,
  }
}

import prisma from 'lib/prisma'
import { getPendingContractTransactionValidator } from './validation'

interface GetPendingContractTransactionsProps {
  userId: number
}

export async function getPendingContractTransactions({ userId }: GetPendingContractTransactionsProps) {
  const fields = await getPendingContractTransactionValidator.validate({ userId })

  const pendingTransactions = await prisma.deployContractTransaction.findMany({
    where: {
      userId: fields.userId,
      status: 'PENDING',
    },
  })

  return pendingTransactions
}

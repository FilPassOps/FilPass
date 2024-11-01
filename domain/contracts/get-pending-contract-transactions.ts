import prisma from 'lib/prisma'
import { getPendingContractTransactionValidator } from './validation'
import { TransactionStatus } from '@prisma/client'

interface GetPendingContractTransactionsProps {
  userId: number
}

export async function getPendingContractTransactions({ userId }: GetPendingContractTransactionsProps) {
  const fields = await getPendingContractTransactionValidator.validate({ userId })

  const pendingTransactions = await prisma.deployContractTransaction.findMany({
    where: {
      userId: fields.userId,
      status: TransactionStatus.PENDING,
    },
  })

  return { data: pendingTransactions }
}

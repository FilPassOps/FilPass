import prisma from 'lib/prisma'
import { getUserTransactionCreditsByUserIdValidator } from './validation'

interface GetUserTransactionCreditsByUserIdParams {
  userId: number
}

export interface Transaction {
  type: string
  id: number
  transaction_hash: string
  status: string
  amount: string
  created_at: string
  wallet_address: string
  contract_address: string
  user_credit_id: number
}

export const getUserTransactionCreditsByUserId = async (props: GetUserTransactionCreditsByUserIdParams) => {
  try {
    const fields = await getUserTransactionCreditsByUserIdValidator.validate(props)

    const transactions = await prisma.$queryRaw<Transaction[]>`
    SELECT * FROM (
      SELECT 'DEPOSIT' as type, ct.id, ct.transaction_hash, ct.status, ct.amount, ct.created_at, sp.wallet_address, uc.id as user_credit_id, c.address as contract_address
      FROM credit_transaction ct
      JOIN user_credit uc ON ct.user_credit_id = uc.id
      JOIN storage_provider sp ON ct.storage_provider_id = sp.id
      JOIN contract c ON uc.contract_id = c.id
      WHERE uc.user_id = ${fields.userId}

      UNION ALL

      SELECT 'REFUND' as type, rt.id, rt.transaction_hash, rt.status, rt.amount, rt.created_at, sp.wallet_address, uc.id as user_credit_id, c.address as contract_address
      FROM refund_transaction rt
      JOIN user_credit uc ON rt.user_credit_id = uc.id
      JOIN storage_provider sp ON uc.storage_provider_id = sp.id
      JOIN contract c ON uc.contract_id = c.id
      WHERE uc.user_id = ${fields.userId}

      UNION ALL

      SELECT 'WITHDRAW' as type, wt.id, wt.transaction_hash, wt.status, wt.amount, wt.created_at, sp.wallet_address, uc.id as user_credit_id, c.address as contract_address
      FROM withdraw_transaction wt
      JOIN user_credit uc ON wt.user_credit_id = uc.id
      JOIN storage_provider sp ON uc.storage_provider_id = sp.id
      JOIN contract c ON uc.contract_id = c.id
      WHERE uc.user_id = ${fields.userId}
    ) AS combined_transactions
    ORDER BY created_at DESC
    LIMIT 10
  `

    return { data: transactions }
  } catch (error) {
    console.log('Error creating comment', error)
    return { error: 'Something went wrong' }
  }
}

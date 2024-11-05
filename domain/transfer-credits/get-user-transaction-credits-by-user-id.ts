import prisma from 'lib/prisma'
import { getUserTransactionCreditsByUserIdValidator } from './validation'

interface GetUserTransactionCreditsByUserIdParams {
  userId: number
  currentPage: number
  pageSize: number
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

    const currentPage = fields.currentPage - 1 < 0 ? 0 : fields.currentPage - 1

    const transactions = await prisma.$queryRaw<Transaction[]>`
    SELECT * FROM (
      SELECT 'DEPOSIT' as type, ct.id, ct.transaction_hash, ct.status, ct.amount, ct.created_at, rc.wallet_address, uc.id as user_credit_id, c.address as contract_address
      FROM credit_transaction ct
      JOIN user_credit uc ON ct.user_credit_id = uc.id
      JOIN receiver rc ON ct.receiver_id = rc.id
      JOIN contract c ON uc.contract_id = c.id
      WHERE uc.user_id = ${fields.userId}

      UNION ALL

      SELECT 'REFUND' as type, rt.id, rt.transaction_hash, rt.status, rt.amount, rt.created_at, rc.wallet_address, uc.id as user_credit_id, c.address as contract_address
      FROM refund_transaction rt
      JOIN user_credit uc ON rt.user_credit_id = uc.id
      JOIN receiver rc ON uc.receiver_id = rc.id
      JOIN contract c ON uc.contract_id = c.id
      WHERE uc.user_id = ${fields.userId}

      UNION ALL

      SELECT 'SUBMIT_TICKET' as type, st.id, st.transaction_hash, st.status, st.amount, st.created_at, rc.wallet_address, uc.id as user_credit_id, c.address as contract_address
      FROM submit_ticket_transaction st
      JOIN user_credit uc ON st.user_credit_id = uc.id
      JOIN receiver rc ON uc.receiver_id = rc.id
      JOIN contract c ON uc.contract_id = c.id
      WHERE uc.user_id = ${fields.userId}
    ) AS combined_transactions
    ORDER BY created_at DESC
    LIMIT ${fields.pageSize}
    OFFSET ${fields.pageSize * currentPage}
  `

    const totalCount = await prisma.$queryRaw<[{ count: bigint }]>`
SELECT COUNT(*) as count FROM (
  SELECT ct.id FROM credit_transaction ct
  JOIN user_credit uc ON ct.user_credit_id = uc.id
  WHERE uc.user_id = ${fields.userId}

  UNION ALL

  SELECT rt.id FROM refund_transaction rt
  JOIN user_credit uc ON rt.user_credit_id = uc.id
  WHERE uc.user_id = ${fields.userId}

  UNION ALL

  SELECT st.id FROM submit_ticket_transaction st
  JOIN user_credit uc ON st.user_credit_id = uc.id
  WHERE uc.user_id = ${fields.userId}
) AS combined_count
`

    return { data: transactions, total: Number(totalCount[0].count) }
  } catch (error) {
    console.log('Error creating comment', error)
    return { error: 'Something went wrong' }
  }
}

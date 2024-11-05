import prisma from 'lib/prisma'
import { getAllSubmitTicketTransactionsValidator } from './validation'
import { TransactionStatus } from '@prisma/client'

interface GetAllSubmitTicketTransactionsParams {
  pageSize: number
  page: number
}

export interface SubmitTicketTransaction {
  id: string
  createdAt: string
  status: TransactionStatus
  transactionHash: string
  userCredit: {
    contract: {
      address: string
      deployedFromAddress: string
    }
  }
}

export async function getAllSubmitTicketTransactions(props: GetAllSubmitTicketTransactionsParams) {
  try {
    const { pageSize, page } = await getAllSubmitTicketTransactionsValidator.validate(props)
    const currentPage = page - 1 < 0 ? 0 : page - 1

    const transactions = await prisma.submitTicketTransaction.findMany({
      select: {
        id: true,
        createdAt: true,
        status: true,
        transactionHash: true,
        userCredit: {
          select: {
            contract: {
              select: {
                address: true,
                deployedFromAddress: true,
              },
            },
          },
        },
      },
      take: pageSize,
      skip: pageSize * currentPage,
      orderBy: {
        id: 'asc',
      },
    })

    const total = await prisma.submitTicketTransaction.count({})

    return {
      data: { transactions, total },
    }
  } catch (error) {
    console.error('Error fetching all submit ticket transactions:', error)
    throw error
  }
}

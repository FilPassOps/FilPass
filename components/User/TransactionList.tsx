import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/solid'
import { TransactionStatus } from '@prisma/client'
import { BlockExplorerLink } from 'components/Shared/BlockExplorerLink'
import { Cell, Header, Table, TableBody, TableHead } from 'components/Shared/Table'
import Timestamp from 'components/Shared/Timestamp'
import { AppConfig } from 'config/system'
import { Transaction } from 'domain/transfer-credits/get-user-transaction-credits-by-user-id'
import { formatUnits } from 'ethers/lib/utils'
import { DateTime } from 'luxon'

interface TransactionListProps {
  transactions: Transaction[]
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  const { token, network } = AppConfig.network.getFilecoin()

  return (
    <div className="flex flex-col relative py-4 overflow-x-auto">
      <Table style={{ display: 'table' }}>
        <TableHead>
          <tr>
            <Header style={{ width: '15%' }}>Date</Header>
            <Header style={{ width: '10%' }}>Type</Header>
            <Header style={{ width: '5%' }}>Amount</Header>
            <Header style={{ width: '25%' }}>Receiver</Header>
            <Header style={{ width: '25%' }}>Contract</Header>
            <Header style={{ width: '10%' }}>Status</Header>
            <Header style={{ width: '10%' }}>Explorer</Header>
          </tr>
        </TableHead>
        <TableBody>
          {transactions.map(transaction => {
            const amount = formatUnits(transaction.amount, token.decimals!)
            return (
              <tr key={transaction.id + transaction.type}>
                <Cell className="break-all">
                  <Timestamp date={transaction.created_at} format={DateTime.DATETIME_SHORT_WITH_SECONDS} />
                </Cell>
                <Cell className="break-all">{getTransactionType(transaction.type).component}</Cell>
                <Cell className="break-all">
                  <p className={getTransactionType(transaction.type).color}>{amount}</p>
                </Cell>
                <Cell className="break-all">
                  <a
                    className="flex text-violets-are-blue text-base leading-6 hover:underline z-10"
                    href={`/transfer-credits/${transaction.user_credit_id}`}
                    onClick={e => e.stopPropagation()}
                  >
                    {transaction.wallet_address}
                  </a>
                </Cell>
                <Cell className="break-all">{transaction.contract_address}</Cell>

                <Cell className="break-all">
                  <strong className={getStatusClass(transaction.status as TransactionStatus)}>{transaction.status}</strong>
                </Cell>
                <Cell className="break-all">
                  <BlockExplorerLink
                    blockExplorerName={network.blockExplorer.name}
                    blockExplorerUrl={network.blockExplorer.url}
                    transactionHash={transaction.transaction_hash}
                  />
                </Cell>
              </tr>
            )
          })}
        </TableBody>
      </Table>
      {transactions.length === 0 && (
        <p className="text-center text-sm space-y-7 py-7 text-gray-800 bg-white border border-gray-100 rounded-sm">No data</p>
      )}
    </div>
  )
}

const getStatusClass = (status: TransactionStatus) => {
  switch (status) {
    case 'PENDING':
      return 'text-yellow-500'
    case 'SUCCESS':
      return 'text-green-500'
    case 'FAILED':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

const getTransactionType = (type: string) => {
  switch (type) {
    case 'DEPOSIT':
      return {
        component: (
          <span className="flex items-center gap-2">
            <ArrowUpIcon className="h-5 w-5 text-green-500 stroke-2" />
            Deposit
          </span>
        ),
        color: 'text-green-500',
      }
    case 'SUBMIT_TICKET':
      return {
        component: (
          <span className="flex items-center gap-2">
            <ArrowDownIcon className="h-5 w-5 text-red-500 stroke-2" />
            Submit Ticket
          </span>
        ),
        color: 'text-red-500',
      }
    case 'REFUND':
      return {
        component: (
          <span className="flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 text-blue-500 stroke-2" /> Refund
          </span>
        ),
        color: 'text-red-500',
      }

    default:
      return {
        component: '-',
        color: 'text-gray-500',
      }
  }
}

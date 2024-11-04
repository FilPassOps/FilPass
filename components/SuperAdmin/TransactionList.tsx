import { TransactionStatus } from '@prisma/client'
import { BlockExplorerLink } from 'components/Shared/BlockExplorerLink'
import { Cell, Header, Table, TableBody, TableHead } from 'components/Shared/Table'
import { AppConfig } from 'config/system'
import { SubmitTicketTransaction } from 'domain/transfer-credits/get-all-submit-ticket-transactions'
import { DateTime } from 'luxon'

interface TransactionListProps {
  transactions: SubmitTicketTransaction[]
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  const { network } = AppConfig.network.getFilecoin()

  return (
    <div className="flex flex-col relative py-4 overflow-x-auto">
      <Table style={{ display: 'table' }}>
        <TableHead>
          <tr>
            <Header style={{ width: '15%' }}>Date</Header>
            <Header style={{ width: '25%' }}>Receiver</Header>
            <Header style={{ width: '25%' }}>Contract</Header>
            <Header style={{ width: '10%' }}>Status</Header>
            <Header style={{ width: '10%' }}>Explorer</Header>
          </tr>
        </TableHead>
        <TableBody>
          {transactions.map(transaction => {
            return (
              <tr key={transaction.id}>
                <Cell className="break-all">
                  {DateTime.fromISO(transaction.createdAt).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}
                </Cell>

                <Cell className="break-all">{transaction.userCredit.contract.address}</Cell>

                <Cell className="break-all">{transaction.userCredit.contract.deployedFromAddress}</Cell>

                <Cell className="break-all">
                  <strong className={getStatusClass(transaction.status as TransactionStatus)}>{transaction.status}</strong>
                </Cell>
                <Cell className="break-all">
                  <BlockExplorerLink
                    blockExplorerName={network.blockExplorer.name}
                    blockExplorerUrl={network.blockExplorer.url}
                    transactionHash={transaction.transactionHash}
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

import { CreditTransactionStatus } from '@prisma/client'
import { BlockExplorerLink } from 'components/Shared/BlockExplorerLink'
import { Cell, Header, Table, TableBody, TableHead } from 'components/Shared/Table'
import { TokenIcon } from 'components/Shared/TokenIcon'
import { AppConfig } from 'config/system'
import { DateTime } from 'luxon'
import { CreditTransactionObject } from 'pages/transfer-credits/transaction-history'

interface TransactionListProps {
  transactions: CreditTransactionObject[]
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  const filecoin = AppConfig.network.getChainByName('Filecoin')

  return (
    <div className="flex flex-col relative py-4">
      <div className="flex flex-col gap-4">
        <Table>
          <TableHead>
            <tr>
              <Header style={{ width: '5%' }}>Id</Header>
              {/* @ts-ignore */}
              <Header style={{ width: '10%' }}>Amount</Header>
              {/* @ts-ignore */}
              <Header style={{ width: '25%' }}>Storage Provider Wallet</Header>
              {/* @ts-ignore */}
              <Header style={{ width: '20%' }}>Created Date</Header>
              {/* @ts-ignore */}
              <Header style={{ width: '10%' }}>Status</Header>
              {/* @ts-ignore */}
              <Header style={{ width: '10%' }}>Explorer</Header>
            </tr>
          </TableHead>
          <TableBody>
            {transactions.map(transaction => {
              return (
                <tr key={transaction.id}>
                  {/* @ts-ignore */}
                  <Cell className="break-all">{transaction.id}</Cell>
                  {/* @ts-ignore */}
                  <Cell className="break-all">
                    <div className="flex items-center gap-2">
                      <p>{transaction.userCredit.amount}</p>
                      <TokenIcon blockchainName={'Filecoin'} tokenSymbol={'tFIL'} width={20} height={20} />
                    </div>
                  </Cell>
                  {/* @ts-ignore */}
                  <Cell className="break-all">{transaction.storageProvider.walletAddress}</Cell>
                  {/* @ts-ignore */}
                  <Cell className="break-all">
                    {DateTime.fromISO(transaction.createdAt).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}
                  </Cell>
                  {/* @ts-ignore */}
                  <Cell className="break-all">
                    <strong className={getStatusClass(transaction.status)}>{transaction.status}</strong>
                  </Cell>
                  {/* @ts-ignore */}
                  <Cell className="break-all">
                    <BlockExplorerLink
                      blockExplorerName={filecoin.blockExplorer.name}
                      blockExplorerUrl={filecoin.blockExplorer.url}
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
    </div>
  )
}

const getStatusClass = (status: CreditTransactionStatus) => {
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

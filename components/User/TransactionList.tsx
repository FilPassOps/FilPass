import { TransactionStatus } from '@prisma/client'
import { BlockExplorerLink } from 'components/Shared/BlockExplorerLink'
import { Cell, Header, Table, TableBody, TableHead } from 'components/Shared/Table'
import { TokenIcon } from 'components/Shared/TokenIcon'
import { AppConfig } from 'config/system'
import { Transaction } from 'domain/transfer-credits/get-user-transaction-credits-by-user-id'
import { formatUnits } from 'ethers/lib/utils'
import { DateTime } from 'luxon'

interface TransactionListProps {
  transactions: Transaction[]
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  const filecoin = AppConfig.network.getChainByName('Filecoin')
  const fil = filecoin.tokens.find(token => token.symbol === 'tFIL')!

  return (
    <div className="flex flex-col relative py-4">
      <div className="flex flex-col gap-4">
        <Table>
          <TableHead>
            <tr>
              <Header style={{ width: '5%' }}>Operation</Header>
              {/* @ts-ignore */}
              <Header style={{ width: '10%' }}>Amount</Header>
              {/* @ts-ignore */}
              <Header style={{ width: '30%' }}>Receiver</Header>
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
              const amount = formatUnits(transaction.amount, fil.decimals!)
              return (
                <tr key={transaction.id + transaction.type}>
                  {/* @ts-ignore */}
                  <Cell className="break-all">{transaction.type}</Cell>
                  {/* @ts-ignore */}
                  <Cell className="break-all">
                    <div className="flex items-center gap-2">
                      <p>{amount}</p>
                      <TokenIcon blockchainName={'Filecoin'} tokenSymbol={'tFIL'} width={20} height={20} />
                    </div>
                  </Cell>
                  {/* @ts-ignore */}
                  <Cell className="break-all">{transaction.wallet_address}</Cell>
                  {/* @ts-ignore */}
                  <Cell className="break-all">
                    {DateTime.fromISO(transaction.created_at).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}
                  </Cell>
                  {/* @ts-ignore */}
                  <Cell className="break-all">
                    <strong className={getStatusClass(transaction.status as TransactionStatus)}>{transaction.status}</strong>
                  </Cell>
                  {/* @ts-ignore */}
                  <Cell className="break-all">
                    <BlockExplorerLink
                      blockExplorerName={filecoin.blockExplorer.name}
                      blockExplorerUrl={filecoin.blockExplorer.url}
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

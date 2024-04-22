import Big from 'big.js'
import { BlockExplorerLink } from 'components/Shared/BlockExplorerLink'
import { LoadingIndicator } from 'components/Shared/LoadingIndicator'
import Sortable from 'components/Shared/Sortable'
import { StatusPill } from 'components/Shared/Status'
import { Cell, Header, LinkedCell, Table, TableBody, TableHead } from 'components/Shared/Table'
import Currency, { CryptoAmount } from 'components/Shared/Table/Currency'
import Timestamp from 'components/Shared/Timestamp'
import { WalletAddress } from 'components/Shared/WalletAddress'
import { AppConfig, isERC20Token } from 'config'
import { USD } from 'domain/currency/constants'
import { PAID_STATUS } from 'domain/transfer-request/constants'
import useCurrency from 'hooks/useCurrency'
import { classNames } from 'lib/class-names'
import { formatCrypto } from 'lib/currency'
import { DateTime } from 'luxon'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'

interface TransferListProps {
  data?: any[]
  shouldShowHeaderCheckbox?: boolean
  onHeaderToggle?: (e: any) => void
  onRequestChecked: (index: number) => void
}

interface Request {
  amount: number
  request_unit: string
  payment_unit: string
  status: string
  transfer_amount: number
  transfer_amount_currency_unit: string
  transfer_hash: string
  wallet_address: string
}

interface CryptoAmountInfoProps {
  tokenIdentifier: string
  request: Request
}

const TransferList = ({ data = [], shouldShowHeaderCheckbox = true, onHeaderToggle, onRequestChecked }: TransferListProps) => {
  const { push, query } = useRouter()
  const [selectAll, setSelectAll] = useState(false)
  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (data && shouldShowHeaderCheckbox) {
      const headerSelected = data.length > 0 && data.every(request => request.selected)

      setSelectAll(headerSelected)
    }
  }, [data, shouldShowHeaderCheckbox])

  useEffect(() => {
    if (shouldShowHeaderCheckbox) {
      const selectedRequests = data.filter(request => request.selected)
      const indeterminate = selectedRequests.length > 0 && selectedRequests.length < data.length
      if (shouldShowHeaderCheckbox && selectAllRef.current) {
        selectAllRef.current.indeterminate = indeterminate
      }
    }
  }, [data, shouldShowHeaderCheckbox])

  let transferDetail: string | undefined = undefined

  if (query.status === PAID_STATUS) {
    transferDetail = 'Block Explorer Link'
  }

  return (
    <div className="flex flex-col">
      <Table>
        <TableHead>
          <tr>
            {shouldShowHeaderCheckbox && (
              <Header style={{ minWidth: 60, width: 60 }}>
                <input type="checkbox" className="cursor-pointer p-1 focus:ring-green-700 text-teal-700" checked={selectAll} onChange={onHeaderToggle} ref={selectAllRef} />
              </Header>
            )}
            <Header style={{ width: 100 }}>
              <Sortable by={'number'}>No.</Sortable>
            </Header>
            <Header style={{ minWidth: 180 }}>
              <Sortable by={'program'}>Program</Sortable>
            </Header>
            <Header style={{ minWidth: 180 }}>Name</Header>
            <Header style={{ minWidth: 200 }}>
              <Sortable by={'create_date'}>Create Date</Sortable>
            </Header>
            <Header style={{ minWidth: 200 }}>Address</Header>
            <Header>Request Amount</Header>
            <Header>{query.status === PAID_STATUS ? `Paid Amount` : `Estimated Amount`}</Header>
            <Header>Status</Header>
            {transferDetail && <Header>{transferDetail}</Header>}
          </tr>
        </TableHead>
        <TableBody>
          {data.map((request, requestIndex) => {
            const chain = AppConfig.network.getChainByName(request.program_blockchain)
            const token = AppConfig.network.getTokenBySymbolAndBlockchainName(request.payment_unit, request.program_blockchain)
            const tokenIdentifier = isERC20Token(token) ? token.erc20TokenAddress : chain.chainId

            const href = `/approvals/${request.id}`

            return (
              <tr
                key={request.id}
                className={classNames(request.selected && 'bg-teal-50', 'cursor-pointer hover:bg-teal-50')}
                onClick={e => {
                  if ((e.target as HTMLTableCellElement).cellIndex > 0) {
                    !e.metaKey && push(href)
                    e.metaKey && window.open(href, '_blank')
                  }
                }}
              >
                {shouldShowHeaderCheckbox && (
                  <Cell style={{ minWidth: 60 }}>
                    <input
                      className="p-1 focus:ring-green-700 text-teal-700 cursor-pointer"
                      type="checkbox"
                      checked={request.selected}
                      onChange={() => onRequestChecked(requestIndex)}
                    />
                  </Cell>
                )}
                <LinkedCell href={href} className="break-all xl:whitespace-nowrap">
                  #{request.id}
                </LinkedCell>
                <LinkedCell href={href}>{request.program_name}</LinkedCell>
                <LinkedCell href={href}>{request.team ? request.team : '-'}</LinkedCell>
                <LinkedCell href={href}>
                  <Timestamp date={request.create_date} format={DateTime.DATETIME_SHORT_WITH_SECONDS} />
                </LinkedCell>
                <LinkedCell href={href}>
                  {request.wallet_address && (
                    <WalletAddress
                      address={request.wallet_address}
                      blockchain={request.wallet_blockchain}
                      isVerified={!!request.wallet_is_verified}
                      shortenLength="very-short"
                    />
                  )}
                  {!request.wallet_address && '-'}
                </LinkedCell>
                <LinkedCell href={href}>
                  {request.amount ? (
                    <Currency amount={request.amount} requestCurrency={request.request_unit} paymentUnit={request.payment_unit} />
                  ) : (
                    '-'
                  )}
                </LinkedCell>
                <LinkedCell href={href}>
                  {request.amount ? (
                    <CryptoAmount>
                      <CryptoAmountInfo tokenIdentifier={tokenIdentifier} request={request} />
                    </CryptoAmount>
                  ) : (
                    '-'
                  )}
                </LinkedCell>
                <LinkedCell href={href}>
                  <StatusPill status={request.status} />
                </LinkedCell>

                {transferDetail && (
                  <Cell>
                    {request.status === PAID_STATUS && request.transfer_hash && (
                      <BlockExplorerLink
                        blockExplorerName={chain?.blockExplorer.name}
                        blockExplorerUrl={chain?.blockExplorer.url}
                        transactionHash={request.transfer_hash}
                      />
                    )}
                  </Cell>
                )}
              </tr>
            )
          })}
        </TableBody>
      </Table>
      {data.length === 0 && (
        <div className="text-center text-sm py-7 text-gray-800 bg-white border border-gray-100 rounded-sm">
          <p>- no data -</p>
        </div>
      )}
    </div>
  )
}

export default TransferList

const CryptoAmountInfo = ({ tokenIdentifier, request }: CryptoAmountInfoProps) => {
  const { currency, isLoading } = useCurrency(tokenIdentifier)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <LoadingIndicator />
      </div>
    )
  }

  if (request.status === PAID_STATUS) {
    return `${request.transfer_amount} ${request.transfer_amount_currency_unit}`
  }

  if (request.request_unit === USD) {
    if (currency) {
      return `${formatCrypto(new Big(request.amount / Number(currency)).toFixed(2))} ${request.payment_unit}`
    } else {
      return '-'
    }
  }

  if (request.request_unit !== USD) {
    return `${request.amount} ${request.request_unit}`
  }
}

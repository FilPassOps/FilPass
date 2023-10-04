import { Blockchain } from '@prisma/client'
import Big from 'big.js'
import { BellCheckbox } from 'components/shared/BellCheckbox'
import { BlockExplorerLink } from 'components/shared/BlockExplorerLink'
import { Button } from 'components/shared/Button'
import { LoadingIndicator } from 'components/shared/LoadingIndicator'
import Sortable from 'components/shared/Sortable'
import { StatusPill } from 'components/shared/Status'
import { Cell, Header, LinkedCell, Table, TableBody, TableHead } from 'components/shared/Table'
import Currency, { CryptoAmount } from 'components/shared/Table/Currency'
import { WalletAddress } from 'components/shared/WalletAddress'
import { WithMetaMaskButton } from 'components/web3/MetaMaskProvider'
import useCurrency from 'components/web3/useCurrency'
import { USD } from 'domain/currency/constants'
import { SUCCESS_STATUS } from 'domain/transfer/constants'
import { APPROVED_STATUS, PAID_STATUS } from 'domain/transferRequest/constants'
import { classNames } from 'lib/classNames'
import { formatCrypto } from 'lib/currency'
import { DateTime } from 'luxon'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { AppConfig, ChainNames } from 'system.config'

interface Request {
  id: number
  publicId: string
  program: {
    name: string
    programCurrency: {
      type: string
      currency: {
        name: string
      }
    }[]
    blockchain: {
      name: string
    }
  }
  team: string
  amount: string
  status: string
  createdAt: string
  updatedAt: string
  wallet: {
    address: string
    blockchain: Blockchain
    verificationId: string
  }
  selected: boolean
  transfers: {
    status: string
    amount: string
    txHash: string
    amountCurrencyUnit: {
      name: string
    }
  }[]
}

interface TransferListProps {
  requests?: Request[]
  onSinglePayClick: (request: any) => void
  onHeaderToggle: (e: any) => void
  onRequestChecked: (requestIndex: number) => void
  onSingleRejectClick: (request: any) => void
  shouldShowHeaderCheckbox?: boolean
  notifyCheckbox?: boolean
}

interface Unit {
  currency: {
    name: string
  }
}

interface CryptoAmountInfoProps {
  chainId: string
  request: Request
  paidTransfer?: {
    amount: string
    amountCurrencyUnit: {
      name: string
    }
  }
  requestUnit: Unit
  paymentUnit: Unit
}

const TransferList = ({
  requests = [],
  onSinglePayClick,
  onHeaderToggle,
  onRequestChecked,
  onSingleRejectClick,
  shouldShowHeaderCheckbox = true,
  notifyCheckbox = false,
}: TransferListProps) => {
  const { push, query } = useRouter()
  const selectAllRef = useRef<HTMLInputElement>(null)
  const [selectAll, setSelectAll] = useState(false)

  // Select checkbox
  useEffect(() => {
    if (requests && shouldShowHeaderCheckbox) {
      const headerSelected = requests.length > 0 && requests.every(request => request.selected)

      setSelectAll(headerSelected)
    }
  }, [requests, shouldShowHeaderCheckbox])

  // Notify Checkbox
  useEffect(() => {
    if (requests && notifyCheckbox) {
      const headerSelected =
        requests.length > 0 && requests.filter(request => request.status === PAID_STATUS).every(request => request.selected)

      setSelectAll(headerSelected)
    }
  }, [requests, notifyCheckbox])

  // Add indeterminate to header-checkbox if there are some selected but not all
  useEffect(() => {
    if (shouldShowHeaderCheckbox) {
      const selectedRequests = requests.filter(request => request.selected)
      const indeterminate = selectedRequests.length > 0 && selectedRequests.length < requests.length
      if (shouldShowHeaderCheckbox) {
        (selectAllRef.current as any).indeterminate = indeterminate
      }
    }
  }, [requests, shouldShowHeaderCheckbox])

  return (
    <div className="flex flex-col w-full">
      <Table>
        <TableHead>
          <tr>
            {shouldShowHeaderCheckbox && (
              <Header style={{ minWidth: 60, width: 60 }}>
                <input type="checkbox" className="cursor-pointer p-1" checked={selectAll} onChange={onHeaderToggle} ref={selectAllRef} />
              </Header>
            )}

            {notifyCheckbox && (
              <Header style={{ minWidth: 60, width: 60 }}>
                <BellCheckbox onClick={onHeaderToggle} checked={selectAll} />
              </Header>
            )}
            <Header style={{ width: 100 }}>
              <Sortable by={'publicId'}>No.</Sortable>
            </Header>
            <Header>
              <Sortable by={'program'}>Program</Sortable>
            </Header>
            <Header>Name</Header>
            <Header style={{ minWidth: 200 }}>
              <Sortable
                defaultSortOrder={query.status === PAID_STATUS ? 'desc' : 'asc'}
                defaultSortField={query.status === PAID_STATUS ? 'updatedAt' : 'createdAt'}
                by={query.status === PAID_STATUS ? 'updatedAt' : 'createdAt'}
              >
                {query.status === PAID_STATUS ? 'Paid Date' : 'Create Date'}
              </Sortable>
            </Header>
            <Header style={{ minWidth: 200 }}>Address</Header>
            <Header>Request Amount</Header>
            <Header>{query.status === PAID_STATUS ? `Paid Amount` : `Estimated Amount`}</Header>
            <Header style={{ minWidth: 190 }}>Status</Header>
            <Header />
          </tr>
        </TableHead>
        <TableBody>
          {requests &&
            requests.map((request, requestIndex) => {
              const paymentUnit = request.program.programCurrency.find(({ type }) => type === 'PAYMENT') as Unit
              const requestUnit = request.program.programCurrency.find(({ type }) => type === 'REQUEST') as Unit
              const href = `/disbursement/${request.publicId}`
              const { blockExplorer, chainId } = AppConfig.network.getChainByName(request.program.blockchain.name as ChainNames)

              const paidTransfer = request?.transfers?.find(({ status }) => status === SUCCESS_STATUS)
              return (
                <tr
                  className={classNames(request.selected && 'bg-indigo-50', 'cursor-pointer hover:bg-indigo-50')}
                  key={request.id}
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
                        type="checkbox"
                        className={classNames('p-1 cursor-pointer')}
                        checked={request.selected}
                        onChange={() => onRequestChecked(requestIndex)}
                      />
                    </Cell>
                  )}
                  {notifyCheckbox && (
                    <Cell style={{ minWidth: 60 }}>
                      <BellCheckbox checked={request.selected} onClick={() => onRequestChecked(requestIndex)} />
                    </Cell>
                  )}
                  <LinkedCell href={href} className="whitespace-normal break-all xl:whitespace-nowrap">
                    #{request.publicId}
                  </LinkedCell>
                  <LinkedCell href={href}>{request.program.name}</LinkedCell>
                  <LinkedCell href={href}>{request.team}</LinkedCell>
                  <LinkedCell href={href}>
                    {DateTime.fromISO(request.status === PAID_STATUS ? request.updatedAt : request.createdAt).toLocaleString(
                      DateTime.DATETIME_SHORT_WITH_SECONDS,
                    )}
                  </LinkedCell>
                  <LinkedCell href={href}>
                    {request?.wallet?.address && (
                      <WalletAddress
                        address={request.wallet.address}
                        blockchain={request.wallet.blockchain.name}
                        isVerified={!!request.wallet.verificationId}
                      />
                    )}
                    {!request.wallet && '-'}
                  </LinkedCell>
                  <LinkedCell href={href}>
                    {request.amount && (
                      <Currency
                        amount={request.amount}
                        requestCurrency={requestUnit.currency.name}
                        paymentUnit={paymentUnit.currency.name}
                      />
                    )}
                  </LinkedCell>
                  <LinkedCell href={href}>
                    <CryptoAmount>
                      <CryptoAmountInfo
                        chainId={chainId}
                        request={request}
                        requestUnit={requestUnit}
                        paymentUnit={paymentUnit}
                        paidTransfer={paidTransfer}
                      />
                    </CryptoAmount>
                  </LinkedCell>
                  <LinkedCell href={href}>
                    <StatusPill status={request.status} />
                  </LinkedCell>
                  <Cell>
                    {request.status === APPROVED_STATUS && (
                      <div
                        className="h-full flex items-center justify-center flex-col space-y-4 2xl:space-y-0 2xl:space-x-4 2xl:flex-row"
                        onClick={e => e.stopPropagation()}
                      >
                        <WithMetaMaskButton
                          variant="outline-green"
                          onClick={() => onSinglePayClick(request)}
                          defaultLabel="Pay"
                          targetChainId={chainId}
                          className="w-full"
                        >
                          Pay
                        </WithMetaMaskButton>

                        <Button variant="outline-red" onClick={() => onSingleRejectClick(request)}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {request.status === PAID_STATUS && paidTransfer?.txHash && (
                      <BlockExplorerLink
                        blockExplorerName={blockExplorer.name}
                        blockExplorerUrl={blockExplorer.url}
                        transactionHash={paidTransfer?.txHash}
                      />
                    )}
                  </Cell>
                </tr>
              )
            })}
        </TableBody>
      </Table>
      {requests.length === 0 && (
        <div className="text-center text-sm py-7 text-gray-800 bg-white border border-gray-100 rounded-sm">
          <p>- no data -</p>
        </div>
      )}
    </div>
  )
}

export default TransferList

const CryptoAmountInfo = ({ chainId, request, requestUnit, paymentUnit, paidTransfer }: CryptoAmountInfoProps) => {
  const { currency } = useCurrency(chainId)

  if (!currency) {
    return (
      <div className="flex items-center justify-center">
        <LoadingIndicator />
      </div>
    )
  }

  if (request.status === PAID_STATUS) {
    return `${paidTransfer?.amount} ${paidTransfer?.amountCurrencyUnit?.name}`
  }

  if (requestUnit.currency.name === USD) {
    if (currency) {
      return `${formatCrypto(new Big(Number(request.amount) / Number(currency)).toFixed(2))} ${paymentUnit.currency.name}`
    } else {
      return '-'
    }
  }

  if (requestUnit.currency.name !== USD) {
    return `${request.amount} ${requestUnit.currency.name}`
  }
}

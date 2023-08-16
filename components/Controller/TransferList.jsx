import Big from 'big.js'
import { useCurrency } from 'components/Currency/Provider'
import { BellCheckbox } from 'components/shared/BellCheckbox'
import { Button } from 'components/shared/Button'
import { Filfox } from 'components/shared/Filfox'
import { LoadingIndicator } from 'components/shared/LoadingIndicator'
import Sortable from 'components/shared/Sortable'
import { StatusPill } from 'components/shared/Status'
import { Cell, Header, LinkedCell, Table, TableBody, TableHead } from 'components/shared/Table'
import Currency, { CryptoAmount } from 'components/shared/Table/Currency'
import { WalletAddress } from 'components/shared/WalletAddress'
import { USD } from 'domain/currency/constants'
import { SUCCESS_STATUS } from 'domain/transfer/constants'
import { APPROVED_STATUS, PAID_STATUS } from 'domain/transferRequest/constants'
import { classNames } from 'lib/classNames'
import { formatCrypto } from 'lib/currency'
import { DateTime } from 'luxon'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { TOKEN } from 'system.config'

const TransferList = ({
  requests = [],
  onSinglePayClick,
  onHeaderToggle,
  onRequestChecked,
  onSingleRejectClick,
  shouldShowHeaderCheckbox = true,
  notifyCheckbox = false,
}) => {
  const { push, query } = useRouter()
  const { filecoin } = useCurrency()
  const selectAllRef = useRef(null)
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
        selectAllRef.current.indeterminate = indeterminate
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
            <Header>{query.status === PAID_STATUS ? `Paid ${TOKEN.symbol} Amount` : `Estimated ${TOKEN.symbol} Amount`}</Header>
            <Header style={{ minWidth: 180 }}>Vesting Start Epoch</Header>
            <Header style={{ minWidth: 180 }}>Vesting Months</Header>
            <Header style={{ minWidth: 190 }}>Status</Header>
            <Header />
          </tr>
        </TableHead>
        <TableBody>
          {requests &&
            requests.map((request, requestIndex) => {
              const paymentUnit = request.program.programCurrency.find(({ type }) => type === 'PAYMENT')
              const requestUnit = request.program.programCurrency.find(({ type }) => type === 'REQUEST')
              const href = `/disbursement/${request.publicId}`

              const paidTransfer = request?.transfers?.find(({ status }) => status === SUCCESS_STATUS)
              return (
                <tr
                  className={classNames(request.selected && 'bg-indigo-50', 'cursor-pointer hover:bg-indigo-50')}
                  key={request.id}
                  onClick={e => {
                    if (e.target.cellIndex > 0) {
                      !e.metaKey && push(href)
                      e.metaKey && window.open(href, '_blank')
                    }
                  }}
                >
                  {shouldShowHeaderCheckbox && (
                    <Cell style={{ minWidth: 60 }} onClick={e => e.stopPropagation()}>
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
                        blockchain={request.wallet.blockchain}
                        isVerified={!!request.wallet.verificationId}
                      />
                    )}
                    {!request.wallet && '-'}
                  </LinkedCell>
                  <LinkedCell href={href}>
                    {filecoin && (
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
                        filecoin={filecoin}
                        request={request}
                        requestUnit={requestUnit}
                        paymentUnit={paymentUnit}
                        paidTransfer={paidTransfer}
                      />
                    </CryptoAmount>
                  </LinkedCell>
                  <LinkedCell href={href}>{request.vestingStartEpoch || '-'}</LinkedCell>
                  <LinkedCell href={href}>{request.vestingMonths || '-'}</LinkedCell>
                  <LinkedCell href={href}>
                    <StatusPill status={request.status} />
                  </LinkedCell>
                  <Cell>
                    {request.status === APPROVED_STATUS && (
                      <div
                        className="h-full flex items-center justify-center flex-col space-y-4 2xl:space-y-0 2xl:space-x-4 2xl:flex-row"
                        onClick={e => e.stopPropagation()}
                      >
                        <Button variant="outline-green" onClick={() => onSinglePayClick(request)}>
                          Pay
                        </Button>
                        <Button variant="outline-red" onClick={() => onSingleRejectClick(request)}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {request.status === PAID_STATUS && <Filfox transfer_hash={paidTransfer?.txHash} />}
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

const CryptoAmountInfo = ({ filecoin, request, requestUnit, paymentUnit, paidTransfer }) => {
  if (!filecoin) {
    return (
      <div className="flex items-center justify-center">
        <LoadingIndicator />
      </div>
    )
  }

  if (request.status === PAID_STATUS) {
    return `${paidTransfer.amount} ${paidTransfer.amountCurrencyUnit?.name ?? TOKEN.symbol}`
  }

  if (requestUnit.currency.name === USD) {
    return `${formatCrypto(new Big(request.amount / filecoin?.rate).toFixed(2))} ${paymentUnit.currency.name}`
  }

  if (requestUnit.currency.name !== USD) {
    return `${request.amount} ${requestUnit.currency.name}`
  }
}

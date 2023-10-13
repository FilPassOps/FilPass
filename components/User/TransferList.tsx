import { DocumentPlusIcon } from '@heroicons/react/24/outline'
import { BlockExplorerLink } from 'components/Shared/BlockExplorerLink'
import { LinkButton } from 'components/Shared/Button'
import Sortable from 'components/Shared/Sortable'
import { StatusPill } from 'components/Shared/Status'
import { Cell, Header, LinkedCell, Table, TableBody, TableHead } from 'components/Shared/Table'
import Currency from 'components/Shared/Table/Currency'
import PaymentControl from 'components/Shared/Table/PaymentControl'
import { WalletAddress } from 'components/Shared/WalletAddress'
import { AppConfig, ChainNames } from 'config'
import { DRAFT_STATUS } from 'domain/transfer-request/constants'
import { DateTime } from 'luxon'
import { useRouter } from 'next/router'

interface Request {
  id: string
  amount: string
  request_unit: string
  payment_unit: string
  status: string
  transfer_amount: number
  transfer_amount_currency_unit: string
  transfer_hash: string
  wallet_address: string
  user_wallet_address: string
  user_wallet_blockchain: string
  user_wallet_is_verified: boolean
  applyer: string
  receiver: string
  program_name: string
  team: string
  create_date: string
  notes: string
}

interface TransferListProps {
  data?: Request[]
}

interface MemoProps {
  notes: string
  transfer_hash: string
  blockchain: string
}

const TransferList = ({ data = [] }: TransferListProps) => {
  const router = useRouter()

  return (
    <div className="flex flex-col">
      <Table>
        <TableHead>
          <tr>
            <Header style={{ width: 100 }}>
              <Sortable by={'number'}>No.</Sortable>
            </Header>
            <Header style={{ minWidth: 190, width: 190 }}>
              <Sortable by={'status'}>Status</Sortable>
            </Header>
            <Header>
              <Sortable by={'program'}>Program</Sortable>
            </Header>
            <Header>Name</Header>
            <Header style={{ minWidth: 200 }}>
              <Sortable by={'create_date'}>Create Date</Sortable>
            </Header>
            <Header style={{ minWidth: 200 }}>Address</Header>
            <Header>Request Amount</Header>
            <Header style={{ minWidth: 180 }}>Receiver / Requestor</Header>
            <Header>Memo</Header>
          </tr>
        </TableHead>
        <TableBody>
          {data.map(request => {
            const href = `/transfer-requests/${request.id}${request.status === DRAFT_STATUS ? '/edit' : ''}`
            return (
              <tr
                key={request.id}
                className="cursor-pointer hover:bg-indigo-50"
                onClick={e => (!e.metaKey && router.push(href)) || (e.metaKey && window.open(href, '_blank'))}
              >
                <LinkedCell href={href} className="break-all xl:whitespace-nowrap">
                  #{request.id}
                </LinkedCell>
                <LinkedCell href={href}>
                  <StatusPill status={request.status} />
                </LinkedCell>
                <LinkedCell href={href}>{request.program_name}</LinkedCell>
                <LinkedCell href={href}>{request.team}</LinkedCell>
                <LinkedCell href={href}>
                  {DateTime.fromISO(request.create_date).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}
                </LinkedCell>
                <LinkedCell href={href}>
                  {request.user_wallet_address && (
                    <WalletAddress
                      address={request.user_wallet_address}
                      blockchain={request.user_wallet_blockchain}
                      isVerified={!!request.user_wallet_is_verified}
                      shortenLength="very-short"
                    />
                  )}
                  {!request.user_wallet_address && '-'}
                </LinkedCell>
                <LinkedCell href={href}>
                  <Currency amount={request.amount} requestCurrency={request.request_unit} paymentUnit={request.payment_unit} />
                </LinkedCell>
                <Cell>
                  <PaymentControl applyer={request.applyer} receiver={request.receiver} />
                </Cell>
                <Cell>
                  <Memo notes={request.notes} transfer_hash={request.transfer_hash} blockchain={request.user_wallet_blockchain} />
                </Cell>
              </tr>
            )
          })}
        </TableBody>
      </Table>
      {data.length === 0 && (
        <div className="text-center text-sm space-y-7 py-7 text-gray-800 bg-white border border-gray-100 rounded-sm">
          <p>You have not submitted any transfer requests yet. Click the button below to create the first one!</p>
          <div className="w-max mx-auto">
            <LinkButton href="/transfer-requests/create">
              <div className="flex justify-center items-center gap-2">
                <DocumentPlusIcon className="h-5 w-5" />
                Create New Request
              </div>
            </LinkButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransferList

const Memo = ({ notes, transfer_hash, blockchain }: MemoProps) => {
  const chain = AppConfig.network.getChainByName(blockchain as ChainNames) || {}

  return (
    <>
      {notes && <p className="break-all whitespace-normal 2xl:truncate w-0 min-w-full">{notes}</p>}
      {transfer_hash && (
        <BlockExplorerLink
          blockExplorerName={chain?.blockExplorer.name}
          blockExplorerUrl={chain?.blockExplorer.url}
          transactionHash={transfer_hash}
        />
      )}
    </>
  )
}

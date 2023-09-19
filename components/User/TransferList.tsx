import { DocumentPlusIcon } from '@heroicons/react/24/outline'
import { Blockchain } from '@prisma/client'
import { useCurrency } from 'components/Currency/Provider'
import { BlockExplorerLink } from 'components/shared/BlockExplorerLink'
import { LinkButton } from 'components/shared/Button'
import { LoadingIndicator } from 'components/shared/LoadingIndicator'
import Sortable from 'components/shared/Sortable'
import { StatusPill } from 'components/shared/Status'
import { Cell, Header, LinkedCell, Table, TableBody, TableHead } from 'components/shared/Table'
import Currency from 'components/shared/Table/Currency'
import PaymentControl from 'components/shared/Table/PaymentControl'
import { WalletAddress } from 'components/shared/WalletAddress'
import { DRAFT_STATUS } from 'domain/transferRequest/constants'
import { DateTime } from 'luxon'
import { useRouter } from 'next/router'
import { getChainByName } from 'system.config'

interface Request {
  id: string
  amount: string
  request_unit: string
  payment_unit: string
  status: string
  transfer_amount: number
  transfer_amount_currency_unit: string
  transfer_hash: string
  delegated_address: string
  wallet_address: string
  user_wallet_address: string
  user_wallet_blockchain: Blockchain
  user_wallet_is_verified: boolean
  applyer: string
  receiver: string
  program_name: string
  team: string
  create_date: string
  notes: string
  program_blockchain: string
}

interface TransferListProps {
  data?: Request[]
}

interface MemoProps {
  notes: string
  transfer_hash: string
  program_blockchain: string
}

const TransferList = ({ data = [] }: TransferListProps) => {
  const router = useRouter()
  const { filecoin } = useCurrency()

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
                      blockchain={request.user_wallet_blockchain.name}
                      isVerified={!!request.user_wallet_is_verified}
                    />
                  )}
                  {!request.user_wallet_address && '-'}
                </LinkedCell>
                <LinkedCell href={href}>
                  {!filecoin && (
                    <div className="flex items-center">
                      <LoadingIndicator className="text-azureish-white" />
                    </div>
                  )}
                  {filecoin && (
                    <Currency amount={request.amount} requestCurrency={request.request_unit} paymentUnit={request.payment_unit} />
                  )}
                </LinkedCell>
                <Cell>
                  <PaymentControl applyer={request.applyer} receiver={request.receiver} />
                </Cell>
                <Cell>
                  <Memo notes={request.notes} transfer_hash={request.transfer_hash} program_blockchain={request.program_blockchain} />
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

const Memo = ({ notes, transfer_hash, program_blockchain }: MemoProps) => {
  const { blockExplorer } = getChainByName(program_blockchain)

  return (
    <>
      {notes && <p className="break-all whitespace-normal 2xl:truncate w-0 min-w-full">{notes}</p>}
      {transfer_hash && (
        <BlockExplorerLink blockExplorerName={blockExplorer.name} blockExplorerUrl={blockExplorer.url} transactionHash={transfer_hash} />
      )}
    </>
  )
}

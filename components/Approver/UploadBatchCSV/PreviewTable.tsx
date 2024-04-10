import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { Cell, Header, Table, TableBody, TableHead } from 'components/Shared/Table'
import Currency from 'components/Shared/Table/Currency'

interface PreviewTableProps {
  data: {
    Email: string
    Custodian: string
    Name: string
    Amount: string
    'Wallet Address'?: string
    'Should Receiver Review'?: string
    Addresses?: string
  }[]
  program?: {
    name: string
    programCurrency: {
      type: string
      currency: {
        name: string
      }
    }[]
  }
}

export const PreviewTable = ({ data, program }: PreviewTableProps) => {
  const request_unit = program?.programCurrency.find(p => p.type === 'REQUEST')?.currency?.name
  const payment_unit = program?.programCurrency.find(p => p.type === 'PAYMENT')?.currency?.name

  return (
    <>
      <div className="flex flex-col">
        <Table>
          <TableHead>
            <tr>
              <Header>Request No.</Header>
              <Header style={{ minWidth: 180 }}>Receiver</Header>
              <Header style={{ minWidth: 180 }}>Program</Header>
              <Header style={{ minWidth: 180 }}>Name</Header>
              <Header style={{ minWidth: 180 }}>Amount</Header>
              <Header style={{ minWidth: 200, width: '100%' }}>Wallet Address</Header>
              <Header style={{ minWidth: 220 }}>Should Receiver Review</Header>
            </tr>
          </TableHead>
          <TableBody>
            {data?.map((item, index) => {
              const shouldReceiverReviewStr = item?.['Should Receiver Review']
              return (
                <tr key={String(index + 1).padStart(3, '0')} className="hover:bg-green-50">
                  <Cell className="break-all xl:whitespace-nowrap">#{String(index + 1).padStart(3, '0')}</Cell>
                  <Cell>{item.Email}</Cell>
                  <Cell>{item?.Custodian ?? program?.name}</Cell>
                  <Cell>{item?.Name || item.Email || '-'}</Cell>
                  <Cell>
                    <Currency amount={item?.Amount} requestCurrency={request_unit} paymentUnit={payment_unit} />
                  </Cell>
                  <Cell>{middleEllipsis(item?.['Wallet Address'] || item?.['Addresses']) || '-'}</Cell>
                  <Cell>
                    {(shouldReceiverReviewStr === 'true' || shouldReceiverReviewStr === 'yes' || shouldReceiverReviewStr === '1') && (
                      <CheckCircleIcon className="w-8 h-8 text-green-900" />
                    )}
                  </Cell>
                </tr>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

function middleEllipsis(str: string | undefined) {
  if (!str) return str
  if (str?.length > 13) {
    return str.substr(0, 6) + '...' + str.substr(str.length - 6, str.length)
  }
  return str
}

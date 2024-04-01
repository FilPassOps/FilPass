import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'

interface ProgramInfoProps {
  paymentCurrency: {
    name: string
  }
  expectedTransferDate?: string
  requestCurrency: any
}

export const ProgramInfo = ({ paymentCurrency, expectedTransferDate, requestCurrency }: ProgramInfoProps) => {
  const _expectedTransferDate = expectedTransferDate || (DateTime.now().plus({ days: 30 }).toISO() as string)
  return (
    <div className="bg-light-gray w-full p-4 rounded-md mb-7">
      <p className="text-sm text-gray-500 mb-4">
        Payment Method :{' '}
        <strong className="text-black font-semibold">
          {requestCurrency?.name ? `Request in ${requestCurrency.name} and` : ''} Pay in {paymentCurrency?.name || ''}
        </strong>
      </p>
      <p className="text-sm text-gray-500">
        Expected payment date:{' '}
        <strong className="text-black font-semibold">
          Before <Timestamp date={_expectedTransferDate} format={DateTime.DATE_SHORT} />
        </strong>
      </p>
    </div>
  )
}

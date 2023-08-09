import { deliveryMethod } from 'domain/programs/constants'
import { DateTime } from 'luxon'

export const ProgramInfo = ({ paymentCurrency, selectedProgram, expectedTransferDate, requestCurrency }) => {
  const _expectedTransferDate = expectedTransferDate || DateTime.now().plus({ days: 30 }).toISO()
  return (
    <div className="bg-light-gray w-full p-4 rounded-md mb-7">
      <p className="text-sm text-gray-500 mb-4">
        Payment Method :{' '}
        <strong className="text-black font-semibold">
          {requestCurrency?.name ? `Request in ${requestCurrency.name} and` : ''} Pay in {paymentCurrency?.name || ''}
        </strong>
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Delivery Method : <strong className="text-black font-semibold">{deliveryMethod[selectedProgram?.deliveryMethod]}</strong>
      </p>
      <p className="text-sm text-gray-500">
        Expected payment date:{' '}
        <strong className="text-black font-semibold">
          {`Before ${DateTime.fromISO(_expectedTransferDate).toLocaleString(DateTime.DATE_SHORT)}`}
        </strong>
      </p>
    </div>
  )
}

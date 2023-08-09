import { DateTime } from 'luxon'

export const RequestorReceiver = ({ applyer, issuedOn, receiver, expectedTransferDate }) => {
  const _issuedOn = issuedOn || DateTime.now().toISO()
  const _expectedTransferDate = expectedTransferDate || DateTime.now().plus({ days: 30 }).toISO()
  const renderReceiver = receiver && applyer !== receiver

  return (
    <dl className={`sm:grid sm:grid-cols-2 sm:grid-flow-col ${renderReceiver && 'sm:grid-rows-2'}`}>
      <div>
        <dt className="text-gray-900 font-medium text-lg">Applier</dt>
        <dd className="text-sm text-gray-500">{applyer}</dd>
      </div>
      {renderReceiver && (
        <div className="mt-4">
          <dt className="text-gray-900 font-medium text-lg">Receiver</dt>
          <dd className="text-sm text-gray-500">{receiver}</dd>
        </div>
      )}
      <div className="mt-4 sm:mt-0 text-sm text-gray-500">
        <div className="flex sm:justify-end">
          <dt>Issued on:</dt>
          <dd>{DateTime.fromISO(_issuedOn).toLocaleString(DateTime.DATE_SHORT)}</dd>
        </div>
        <div className="flex sm:justify-end">
          <dt>Expected Payment Date:</dt>
          <dd>{DateTime.fromISO(_expectedTransferDate).toLocaleString(DateTime.DATE_SHORT)}</dd>
        </div>
      </div>
    </dl>
  )
}

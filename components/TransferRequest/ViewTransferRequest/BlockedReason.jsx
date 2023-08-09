import { BLOCKED_STATUS, REJECTED_BY_COMPLIANCE_STATUS } from 'domain/transferRequest/constants'
import { classNames } from 'lib/classNames'

export const BlockedReason = ({ reason, status }) => {
  const showReason = reason && (status === REJECTED_BY_COMPLIANCE_STATUS || status === BLOCKED_STATUS)
  return (
    <>
      {showReason && (
        <div className={classNames('my-7 text-sm rounded-lg p-4 space-y-4', config[status]?.style)}>
          <p className="font-bold">{config[status]?.text}</p>
          <p dangerouslySetInnerHTML={{ __html: reason }}></p>
        </div>
      )}
    </>
  )
}

const config = {
  [REJECTED_BY_COMPLIANCE_STATUS]: {
    style: 'bg-light-red text-international-orange',
    text: 'Reason for rejection:',
  },
  [BLOCKED_STATUS]: {
    style: 'bg-light-red text-international-orange',
    text: 'Reason for hold:',
  },
}

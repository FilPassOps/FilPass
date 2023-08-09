import { classNames } from 'lib/classNames'

export const StatusBadge = ({ status = 'paid' }) => {
  const { className, style, text } = config[status.toLowerCase()]

  return (
    <span
      className={classNames(
        'md:w-[150px] inline-flex items-center justify-center px-2 py-2 rounded-md font-bold text-sm md:text-base whitespace-nowrap',
        className
      )}
      style={style}
    >
      {text}
    </span>
  )
}

export const StatusPill = ({ status = 'paid' }) => {
  const { className, style, text } = config[status.toLowerCase()]

  return (
    <div
      className={classNames(
        'flex rounded-full py-2 px-4 align-middle justify-center text-sm w-full font-bold min-w-min whitespace-normal break-all xl:whitespace-nowrap',
        className
      )}
      style={{ ...style }}
    >
      {text}
    </div>
  )
}

const config = {
  paid: {
    className: 'text-indigo-500 bg-lavander',
    text: 'Paid',
    style: {},
  },
  requires_changes: {
    className: 'text-gamboge-orange bg-papaya-whip',
    text: 'Requires Change',
    style: {},
  },
  submitted: {
    className: 'text-vivid-cerulean bg-water',
    text: 'Submitted',
    style: {},
  },
  submitted_by_approver: {
    className: 'text-vivid-cerulean bg-water',
    text: 'Submitted',
    style: {},
  },
  approved: {
    className: 'text-kelly-green bg-approved-green',
    text: 'Approved',
    style: { backgroundColor: '#CCEABA' },
  },
  rejected: {
    className: 'text-international-orange bg-light-red',
    text: 'Rejected',
    style: {},
  },
  rejected_by_approver: {
    className: 'text-international-orange bg-light-red',
    text: 'Rejected',
    style: {},
  },
  rejected_by_controller: {
    className: 'text-international-orange bg-light-red',
    text: 'Rejected',
    style: {},
  },
  voided: {
    className: 'text-davy-grey bg-platinum',
    text: 'Voided',
    style: {},
  },
  draft: {
    className: 'text-heliotrope-magenta bg-pink-lace',
    text: 'Draft',
    style: {},
  },
  blocked: {
    className: 'text-international-orange bg-light-red',
    text: 'On Hold', //ON_HOLD is an alias for BLOCKED
    style: {},
  },
  on_hold: {
    className: 'text-international-orange bg-light-red',
    text: 'On Hold', //ON_HOLD is an alias for BLOCKED
    style: {},
  },
  processing: {
    className: 'text-heliotrope-magenta bg-pink-lace',
    text: 'Processing',
    style: {},
  },
  on_review: {
    className: 'text-heliotrope-magenta bg-pink-lace',
    text: 'Awaiting review',
    style: {},
  },
  rejected_by_compliance: {
    className: 'text-international-orange bg-light-red',
    text: 'Rejected',
    style: {},
  },
}

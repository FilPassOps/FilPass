import {
  DRAFT_STATUS,
  REJECTED_BY_APPROVER_STATUS,
  REJECTED_BY_CONTROLLER_STATUS,
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_STATUS,
} from 'domain/transfer-request/constants'
import { classNames } from 'lib/class-names'
import { DateTime } from 'luxon'
import { useState } from 'react'

interface StatusNotesProps {
  notes: string
  status: string
  changesRequested?: any[]
}

interface RequiresChangesProps {
  changesRequested: {
    id: string
    notes: string
    createdAt: string
  }[]
}

export const StatusNotes = ({ notes, status, changesRequested = [] }: StatusNotesProps) => {
  const showNotes =
    status === REQUIRES_CHANGES_STATUS ||
    status === REJECTED_BY_APPROVER_STATUS ||
    status === REJECTED_BY_CONTROLLER_STATUS ||
    status === DRAFT_STATUS ||
    (status === SUBMITTED_STATUS && notes) ||
    changesRequested.length > 0

  return (
    <>
      {showNotes && (
        <div className={classNames('my-7 text-sm rounded-lg p-4 space-y-4', config[status]?.style)}>
          {config[status]?.text && <p className="font-bold">{config[status].text}</p>}
          {changesRequested.length > 0 && (status === REQUIRES_CHANGES_STATUS || status === SUBMITTED_STATUS) ? (
            <RequiresChanges changesRequested={changesRequested} />
          ) : (
            (notes || config[status]?.description) && <p className="whitespace-pre-line">{notes || config[status]?.description}</p>
          )}
        </div>
      )}
    </>
  )
}

const RequiresChanges = ({ changesRequested }: RequiresChangesProps) => {
  const [filteredReviews, setFilteredReviews] = useState([...changesRequested.slice(0, 2)])
  const [showAll, setShowAll] = useState(false)

  const handleShowAll = () => {
    setFilteredReviews([...changesRequested])
    setShowAll(true)
  }

  return (
    <div className="space-y-4">
      {filteredReviews.map(change => (
        <div key={change.id} className="flex justify-between">
          <p className="whitespace-pre-line">{change.notes}</p>
          <p className="whitespace-nowrap">{DateTime.fromISO(change.createdAt).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}</p>
        </div>
      ))}
      {changesRequested.length > 2 && !showAll && (
        <button className="text-sm font-bold cursor-pointer" onClick={handleShowAll}>
          (show more)
        </button>
      )}
    </div>
  )
}

const config: Record<string, { style: string; text: string; description?: string }> = {
  [REJECTED_BY_APPROVER_STATUS]: {
    style: 'bg-light-red text-international-orange',
    text: 'Reason for rejection:',
  },
  [REJECTED_BY_CONTROLLER_STATUS]: {
    style: 'bg-light-red text-international-orange',
    text: 'Reason for rejection:',
  },
  [REQUIRES_CHANGES_STATUS]: {
    style: 'text-gamboge-orange bg-papaya-whip',
    text: 'Change details:',
  },
  [SUBMITTED_STATUS]: {
    style: 'text-gamboge-orange bg-papaya-whip',
    text: 'Change details:',
  },
  [DRAFT_STATUS]: {
    style: 'text-heliotrope-magenta bg-pink-lace',
    text: 'This Request Is A Draft',
  },
}

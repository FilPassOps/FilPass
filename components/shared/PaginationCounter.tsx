import { APPROVED_STATUS, PAID_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'

interface PaginationCounterProps {
  total?: number
  status?: string
}

export const PaginationCounter = ({ total = 0, status = SUBMITTED_STATUS }: PaginationCounterProps) => {
  if (total < 1) {
    return null
  }

  return (
    <div className="w-full mt-4 bg-platinum p-3 text-black text-center">
      Selected {total} {dictionary[status]} requests
    </div>
  )
}

const dictionary: Record<string, string> = {
  [SUBMITTED_STATUS]: 'submitted',
  [APPROVED_STATUS]: 'approved',
  [PAID_STATUS]: 'paid',
}

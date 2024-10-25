import { LinkButton } from 'components/Shared/Button'
import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'
import { SplitTicketGroup } from 'pages/transfer-credits/[id]'

interface SplitTicketsGroupListProps {
  splitGroup: SplitTicketGroup[]
  userCreditId: number
}

export const SplitTicketsGroupList = ({ splitGroup, userCreditId }: SplitTicketsGroupListProps) => {
  return (
    <div>
      {splitGroup.length > 0 ? (
        <div className="space-y-4">
          {splitGroup.map((split, index) => (
            <div key={split.splitGroup} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-deep-koamaru">Split Tickets Group {index + 1}</h3>
                  <p className=" text-deep-koamaru">{split.totalTickets} tickets</p>
                  <Timestamp date={split.createdAt.toString()} format={DateTime.DATETIME_SHORT} />
                </div>
                <LinkButton
                  href={`/transfer-credits/${userCreditId}/${split.splitGroup}`}
                  className="w-fit flex items-center justify-center flex-shrink-0"
                  variant="secondary"
                >
                  View
                </LinkButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No ticket groups yet.</p>
      )}
    </div>
  )
}

import { LinkButton } from 'components/Shared/Button'
import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'
import { TicketGroup } from 'pages/transfer-credits/[id]'

interface TicketsGroupListProps {
  ticketGroups: TicketGroup[]
  userCreditId: number
}

export const TicketGroupList = ({ ticketGroups, userCreditId }: TicketsGroupListProps) => {
  return (
    <div>
      {ticketGroups.length > 0 ? (
        <div className="space-y-4">
          {ticketGroups.map((ticketGroup, index) => (
            <div key={ticketGroup.ticketGroupId} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-deep-koamaru">Tickets Group {index + 1}</h3>
                  <p className=" text-deep-koamaru">{ticketGroup.totalTickets} tickets</p>
                  <Timestamp date={ticketGroup.createdAt.toString()} format={DateTime.DATETIME_SHORT} />
                </div>
                <LinkButton
                  href={`/transfer-credits/${userCreditId}/${ticketGroup.ticketGroupId}`}
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

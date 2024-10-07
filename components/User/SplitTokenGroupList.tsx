import { LinkButton } from 'components/Shared/Button'
import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'
import { SplitTokenGroup } from 'pages/transfer-credits/[id]'

interface SplitTokenGroupListProps {
  splitGroup: SplitTokenGroup[]
  currentHeight: Big
  maxHeight: string
  userCreditId: number
}

export const SplitTokenGroupList = ({ splitGroup, userCreditId }: SplitTokenGroupListProps) => {
  return (
    <div>
      {splitGroup.length > 0 ? (
        <div className="space-y-4">
          {splitGroup.map((split, index) => (
            <div key={split.splitGroup} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-deep-koamaru">Split Token Group {index + 1}</h3>
                  <p className=" text-deep-koamaru">{split.totalTokens} tokens</p>
                  <Timestamp date={split.createdAt.toString()} format={DateTime.DATE_SHORT} />
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
        <p className="text-gray-600">No token groups yet.</p>
      )}
    </div>
  )
}

import { LinkButton } from 'components/shared/Button'
import { ViewTransferRequest } from 'components/TransferRequest/ViewTransferRequest'
import { CONTROLLER_ROLE } from 'domain/auth/constants'

interface TransferRequestViewProps {
  data: {
    id: number
    publicId: string
    senderWalletAddress: string
    receiverWalletAddress: string
    amount: string
    status: string
    reason: string
    createdAt: string
    updatedAt: string
  }
}

export const TransferRequestView = ({ data }: TransferRequestViewProps) => {
  return (
    <>
      <ViewTransferRequest data={data} role={CONTROLLER_ROLE} showLegacyWarning={false}/>
      <div className="max-w-min mx-auto">
        <LinkButton variant="outline" href="/disbursement">
          Back
        </LinkButton>
      </div>
    </>
  )
}

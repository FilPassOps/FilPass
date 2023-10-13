import { LinkButton } from 'components/Shared-tmp/Button'
import { ViewTransferRequest, ViewTransferRequestProps } from 'components/TransferRequest/ViewTransferRequest'
import { CONTROLLER_ROLE } from 'domain/auth/constants'

export type TransferRequestViewProps = Omit<ViewTransferRequestProps, 'role'> & {
  role?: string
}

export const TransferRequestView = ({ data }: TransferRequestViewProps) => {
  return (
    <>
      <ViewTransferRequest data={data} role={CONTROLLER_ROLE} />
      <div className="max-w-min mx-auto">
        <LinkButton variant="outline" href="/disbursement">
          Back
        </LinkButton>
      </div>
    </>
  )
}

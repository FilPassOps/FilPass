import { LinkButton } from 'components/shared/Button'
import { ViewTransferRequest } from 'components/TransferRequest/ViewTransferRequest'
import { CONTROLLER_ROLE } from 'domain/auth/constants'

export const TransferRequestView = ({ data }) => {
  return (
    <>
      <ViewTransferRequest
        data={data}
        role={CONTROLLER_ROLE}
      />
      <div className="max-w-min mx-auto">
        <LinkButton variant="outline" href="/disbursement">
          Back
        </LinkButton>
      </div>
    </>
  )
}

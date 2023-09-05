import { REQUIRES_CHANGES_STATUS, SUBMITTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { EditTransferRequestAsApprover } from 'components/TransferRequest/ViewTransferRequest/edit'

interface TransferRequestEditProps {
  data: {
    id: string
    status: string
    changesRequested: any[]
    notes: string
    created_at: string
    program_name: string
    team: string
    wallet_id: string
    wallet_address: string
    wallet_is_verified: boolean
    wallet_name: string
    request_unit: string
    payment_unit: string
    program_delivery_method: string
    expected_transfer_date: string
    amount: string
    attachment_id: string
    attachment_filename: string
    attachment_uploader_email: string
    attachment_user_email: string
    delegated_address: string
    history: any[]
    applyer: string
    receiver: string
  }
}

export const TransferRequestEdit = ({ data }: TransferRequestEditProps) => {
  const showEdit = [SUBMITTED_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_BY_APPROVER_STATUS].includes(data.status)
  if (!showEdit) return <>Incorrect status.</>

  return <EditTransferRequestAsApprover data={data} role={APPROVER_ROLE} />
}

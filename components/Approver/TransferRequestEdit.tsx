import { REQUIRES_CHANGES_STATUS, SUBMITTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { EditTransferRequestAsApprover } from 'components/TransferRequest/ViewTransferRequest/edit'

interface TransferRequestEditProps {
  data: {
    status: string
  }
}

export const TransferRequestEdit = ({ data }: TransferRequestEditProps) => {
  const showEdit = [SUBMITTED_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_BY_APPROVER_STATUS].includes(data.status)
  if (!showEdit) return <>Incorrect status.</>

  return <EditTransferRequestAsApprover data={data} role={APPROVER_ROLE} />
}

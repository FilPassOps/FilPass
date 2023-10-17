import { Divider } from 'components/Shared/Divider'
import Timestamp from 'components/Shared/Timestamp'
import { USER_ROLE } from 'domain/auth/constants'
import { DateTime } from 'luxon'

interface TransferRequestHistoryProps {
  history: {
    id: string
    email: string
    field: string
    old_value: string
    new_value: string
    created_at: string
  }[]
  role: string
  owner: string
}

interface FormatUserEmailProps {
  item: {
    email: string
    field: string
  }
  owner: string
  role: string
}

interface FormatFieldValueProps {
  field: string
  value: string
  role?: string
}

interface FormatStatusProps {
  status: string
  role?: string
}

export const TransferRequestHistory = ({ history = [], role = USER_ROLE, owner }: TransferRequestHistoryProps) => {
  return (
    <div>
      <div className="my-8 space-y-6">
        <h3 className="text-gray-700 font-medium">History</h3>

        {history
          .filter(item => item.field !== 'terms')
          .map(item => (
            <div key={item.id} className="grid grid-cols-12 text-sm text-gray-500">
              <p className="truncate col-span-3">{formatUserEmail({ item, owner, role })}</p>
              <div className="col-span-6 text-left flex flex-wrap space-x-1">
                <span>Changed</span>
                <strong className="whitespace-nowrap">{formatFieldName(item.field)}</strong>
                <span>from</span>
                <strong>{formatFieldValue({ field: item.field, value: item.old_value })}</strong>
                <span>to</span>
                <strong>{formatFieldValue({ field: item.field, value: item.new_value, role })}</strong>
              </div>
              <p className="col-span-3 text-right">
                <Timestamp date={item.created_at} format={DateTime.DATETIME_SHORT_WITH_SECONDS} />
              </p>
            </div>
          ))}
      </div>
      <Divider />
    </div>
  )
}

const formatUserEmail = ({ item, owner, role }: FormatUserEmailProps) => {
  if (
    role === USER_ROLE &&
    ((item.email.match(/(@protocol\.ai)/gi) && owner !== item.email) || (item.email.match(/(@protocol\.ai)/gi) && item.field === 'status'))
  ) {
    return 'Protocol Labs'
  }
  return item.email
}

const formatFieldName = (field: string) => {
  switch (field) {
    case 'status':
      return 'Status'
    case 'team':
      return 'Name'
    case 'amount':
      return 'Requested amount'
    case 'programId':
      return 'Program'
    case 'userWalletId':
      return 'Wallet Address'
    case 'userFileId':
      return 'Form'
    case 'attachmentId':
      return 'Attachment'
    default:
      return field
  }
}

const formatFieldValue = ({ field, value, role }: FormatFieldValueProps) => {
  switch (field) {
    case 'status':
      return formatStatus({ status: value, role })
    default:
      return value
  }
}

const formatStatus = ({ status, role }: FormatStatusProps) => {
  switch (status) {
    case 'SUBMITTED':
      return 'Submitted'
    case 'SUBMITTED_BY_APPROVER':
      return 'Submitted'
    case 'VOIDED':
      return 'Voided'
    case 'APPROVED':
      return 'Approved'
    case 'REJECTED_BY_APPROVER':
      if (role !== USER_ROLE) {
        return 'Rejected by Approver'
      }
      return 'Rejected'
    case 'REJECTED_BY_CONTROLLER':
      if (role !== USER_ROLE) {
        return 'Rejected by Controller'
      }
      return 'Rejected'
    case 'REQUIRES_CHANGES':
      return 'Requires changes'
    case 'PAID':
      return 'Paid'
    case 'REJECTED':
      return 'Rejected'
    case 'PROCESSING':
      return 'Processing'
    default:
      return status
  }
}

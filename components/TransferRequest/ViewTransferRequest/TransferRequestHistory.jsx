import { Divider } from 'components/shared/Divider'
import { USER_ROLE } from 'domain/auth/constants'
import { DateTime } from 'luxon'

export const TransferRequestHistory = ({ history = [], role = USER_ROLE, owner }) => {
  return (
    <div>
      <div className="my-8 space-y-6">
        <h3 className="text-gray-700 font-medium">History</h3>

        {history
          .filter(item => item.field !== 'terms')
          .map(item => (
            <div key={item.id} className="grid grid-cols-12 text-sm text-gray-500">
              <p className="truncate col-span-3">{formatUserEmail(item, owner, role)}</p>
              <div className="col-span-6 text-left flex flex-wrap space-x-1">
                <span>Changed</span>
                <strong className="whitespace-nowrap">{formatFieldName(item.field)}</strong>
                <span>from</span>
                <strong>{formatFieldValue(item.field, item.old_value)}</strong>
                <span>to</span>
                <strong>{formatFieldValue(item.field, item.new_value, role)}</strong>
              </div>
              <p className="col-span-3 text-right">
                {DateTime.fromISO(item.created_at).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}
              </p>
            </div>
          ))}
      </div>
      <Divider />
    </div>
  )
}

const formatUserEmail = (item, owner, role) => {
  if (
    role === USER_ROLE &&
    ((item.email.match(/(@protocol\.ai)/gi) && owner !== item.email) || (item.email.match(/(@protocol\.ai)/gi) && item.field === 'status'))
  ) {
    return 'Protocol Labs'
  }
  return item.email
}

const formatFieldName = field => {
  switch (field) {
    case 'status':
      return 'Status'
    case 'team':
      return 'Name'
    case 'amount':
      return 'Requested amount'
    case 'isUSResident':
      return 'Is US Resident'
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

const formatFieldValue = (field, value, role) => {
  switch (field) {
    case 'isUSResident':
      return value === 'true' ? 'Yes' : 'No'
    case 'status':
      return formatStatus(value, role)
    default:
      return value
  }
}

const formatStatus = (status, role) => {
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
    case 'BLOCKED':
      return 'On Hold' //ON_HOLD is an alias for BLOCKED
    case 'PROCESSING':
      return 'Processing'
    case 'REJECTED_BY_COMPLIANCE':
      if (role !== USER_ROLE) {
        return 'Rejected by Compliance'
      }
      return 'Rejected'
    default:
      return status
  }
}

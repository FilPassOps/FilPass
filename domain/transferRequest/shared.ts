import { BLOCKED_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from './constants'

interface IsEditableParams {
  status: string
}

interface IsVoidableParams {
  status: string
}

export function isEditable({ status }: IsEditableParams) {
  return (
    status === SUBMITTED_STATUS ||
    status === SUBMITTED_BY_APPROVER_STATUS ||
    status === REQUIRES_CHANGES_STATUS ||
    status === BLOCKED_STATUS
  )
}

export function isVoidable({ status }: IsVoidableParams) {
  return (
    status === SUBMITTED_STATUS ||
    status === SUBMITTED_BY_APPROVER_STATUS ||
    status === REQUIRES_CHANGES_STATUS ||
    status === BLOCKED_STATUS
  )
}

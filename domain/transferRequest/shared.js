import { BLOCKED_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from './constants'

export function isEditable({ status }) {
  return status === SUBMITTED_STATUS || status === SUBMITTED_BY_APPROVER_STATUS || status === REQUIRES_CHANGES_STATUS || status === BLOCKED_STATUS
}

export function isVoidable({ status }) {
  return status === SUBMITTED_STATUS || status === SUBMITTED_BY_APPROVER_STATUS || status === REQUIRES_CHANGES_STATUS || status === BLOCKED_STATUS
}

import {
  ADDRESS_MANAGER_ROLE,
  APPROVER_ROLE,
  COMPLIANCE_ROLE,
  CONTROLLER_ROLE,
  FINANCE_ROLE,
  SUPERADMIN_ROLE,
  USER_ROLE,
  VIEWER_ROLE,
} from 'domain/auth/constants'
import { UserResult } from 'domain/user'

export const RoleToRequestAttributeMap = {
  [CONTROLLER_ROLE]: 'controllerId',
  [APPROVER_ROLE]: 'approverId',
  [ADDRESS_MANAGER_ROLE]: 'addressManagerId',
  [SUPERADMIN_ROLE]: 'superAdminId',
  [USER_ROLE]: 'userRoleId',
  [COMPLIANCE_ROLE]: 'complianceId',
  [VIEWER_ROLE]: 'viewerId',
  [FINANCE_ROLE]: 'financeId',
}

export function extractRoles(roles: UserResult['roles'] = []) {
  return roles.reduce((roleMap, { role, id }) => {
    return {
      ...roleMap,
      [RoleToRequestAttributeMap[role]]: id,
    }
  }, {} as { [key: string]: number })
}

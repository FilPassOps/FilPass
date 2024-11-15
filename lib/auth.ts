import { ADDRESS_MANAGER_ROLE, SUPERADMIN_ROLE, USER_ROLE } from 'domain/auth/constants'
import { UserResult } from 'domain/user'

export const RoleToRequestAttributeMap = {
  [ADDRESS_MANAGER_ROLE]: 'addressManagerId',
  [SUPERADMIN_ROLE]: 'superAdminId',
  [USER_ROLE]: 'userRoleId',
}

export function extractRoles(roles: UserResult['roles'] = []) {
  return roles.reduce(
    (roleMap, { role, id }) => {
      if (role in RoleToRequestAttributeMap) {
        return {
          ...roleMap,
          [RoleToRequestAttributeMap[role as keyof typeof RoleToRequestAttributeMap]]: id,
        }
      }
      return roleMap
    },
    {} as { [key: string]: number },
  )
}

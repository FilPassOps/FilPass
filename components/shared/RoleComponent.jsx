import { useAuth } from 'components/Authentication/Provider'

export function RoleComponent({ children, roles = [] }) {
  const { user } = useAuth()
  const hasRole = user?.roles?.some((userRole) => roles.includes(userRole.role))

  return <>{hasRole && children}</>
}

export const withRoles = (roles = [], children) => (
  <RoleComponent roles={roles}>{children}</RoleComponent>
)

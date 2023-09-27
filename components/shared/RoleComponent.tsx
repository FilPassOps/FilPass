import { useAuth } from 'components/Authentication/Provider'

interface RoleComponentProps {
  children: React.ReactNode
  roles?: string[]
}

export function RoleComponent({ children, roles = [] }: RoleComponentProps) {
  const { user } = useAuth()
  const hasRole = user?.roles?.some(userRole => roles.includes(userRole.role))

  return <>{hasRole && children}</>
}

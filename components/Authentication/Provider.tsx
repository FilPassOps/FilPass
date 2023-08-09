import { UserResult } from 'domain/user'
import { fetcher } from 'lib/fetcher'
import { createContext, ReactChild, useContext } from 'react'
import useSWR, { KeyedMutator } from 'swr'

export interface UserMeType extends UserResult {
  isTaxFormActive: boolean
}

type AuthContextType = {
  user: UserMeType | undefined
  refresh: KeyedMutator<UserMeType>
}

export const AuthContext = createContext({} as AuthContextType)

interface AuthPoviderParams {
  children: ReactChild
}

export const AuthProvider = ({ children }: AuthPoviderParams) => {
  const { data: user, mutate } = useSWR<UserMeType>('/auth/me', fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const context = {
    user,
    refresh: mutate,
  }

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

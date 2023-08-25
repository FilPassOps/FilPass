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

// Check for possible issues here with data being null/undefined as its not waiting for loading to finish
export const AuthProvider = ({ children }: AuthPoviderParams) => {
  const { data: user, mutate, isLoading } = useSWR<UserMeType>('/auth/me', fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const context = {
    user,
    refresh: mutate,
    isLoading
  }

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

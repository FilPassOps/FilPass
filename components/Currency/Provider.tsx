import { useAuth } from 'components/Authentication/Provider'
import { fetcher } from 'lib/fetcher'
import { createContext, useContext } from 'react'
import useSWR from 'swr'
import { TOKEN } from 'system.config'

interface CurrencyContextProps {
  filecoin: any
  refresh: () => void
}

export const CurrencyContext = createContext({})

export const CurrencyProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const { user } = useAuth()
  const shouldFetch = user?.id ? `currency/${TOKEN.symbol}` : null

  const { data: filecoin, mutate } = useSWR(shouldFetch, fetcher, {
    revalidateOnMount: true,
  })

  const context = {
    filecoin,
    refresh: mutate,
  }

  return <CurrencyContext.Provider value={context}>{children}</CurrencyContext.Provider>
}

export const useCurrency = () => useContext(CurrencyContext) as CurrencyContextProps

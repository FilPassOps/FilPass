import { useAuth } from 'components/Authentication/Provider'
import { api } from 'lib/api'
import useSWR, { Fetcher } from 'swr'

const fetcher: Fetcher<number, string> = (url: string) => api.get(url).then(res => res.data?.rate)

const useCurrency = (tokenIdentifier: string) => {
  const { user } = useAuth()

  const shouldFetch = user?.id && tokenIdentifier ? `currency/${tokenIdentifier}` : null

  const { data, isLoading, mutate } = useSWR(shouldFetch, fetcher, {
    revalidateOnMount: true,
  })

  return {
    currency: data,
    isLoading,
    mutate,
  }
}

export default useCurrency

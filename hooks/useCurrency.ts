import { useAuth } from 'components/Authentication/Provider'
import { api } from 'lib/api'
import useSWR, { Fetcher } from 'swr'

const fetcher: Fetcher<number, string> = (url: string) => api.get(url).then(res => res.data?.rate)

const useCurrency = (chainId: string) => {
  const { user } = useAuth()

  const shouldFetch = user?.id && chainId ? `currency/${chainId}` : null

  const { data, isLoading, mutate } = useSWR(shouldFetch, fetcher, {
    revalidateOnMount: true,
  })

  return {
    //TODO: OPEN-SOURCE - use data from request
    currency: 1,
    isLoading,
    mutate,
  }
}

export default useCurrency

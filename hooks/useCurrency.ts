import { useAuth } from 'components/Authentication/Provider'
import useSWR, { Fetcher } from 'swr'
import { api } from 'lib/api'

const fetcher: Fetcher<number, string> = (url: string) => api.get(url).then(res => res.data?.rate)

const useCurrency = (chainId: string) => {
  const { user } = useAuth()

  const shouldFetch = (user?.id && chainId) ? `currency/${chainId}` : null

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

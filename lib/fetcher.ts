import { api } from 'lib/api'

export const fetcher = async (url: string) => {
  const { data, error } = await api.get(url)
  if (error) {
    return error
  }
  return data
}

import { AxiosRequestConfig } from 'axios'
import { api } from 'lib/api'

export const fetcher = async (url: string) => {
  const { data, error } = await api.get(url)
  if (error) {
    throw error
  }
  return data
}

export const fetcherWithParams = async (url: string, requestData: AxiosRequestConfig) => {
  const { data, error } = await api.get(url, requestData)
  if (error) {
    throw error
  }
  return data
}

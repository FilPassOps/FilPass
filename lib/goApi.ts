import axios, { AxiosInstance, AxiosResponse } from 'axios'

export interface CID {
  '/': string
}

const GO_LANG_API = process.env.GO_LANG_API

if (!GO_LANG_API) {
  throw new Error('Please define GO_LANG_API environment variable')
}

const api: AxiosInstance = axios.create({
  baseURL: GO_LANG_API,
  timeout: 3 * 60 * 1000, //3 minutes
})

export const lockBalancePropose = async (body: any): Promise<AxiosResponse<CID>> => {
  return await api.post('/', body)
}

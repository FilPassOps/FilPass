import axios, { AxiosRequestConfig } from 'axios'
import Bottleneck from 'bottleneck'
import config from 'chains.config'

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000,
})

export const api = axios.create({
  baseURL: config.blockExplorerApi,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
})

export const getBlockContent = async (cid: string) => {
  return await limiter.schedule(() => api.get(`message/${cid}`))
}

export const getMessage = async (transactionHash: string) => {
  return await limiter.schedule(() => api.get(`message/${transactionHash}`))
}

export const getAddressMessages = async (addr: string, params: AxiosRequestConfig['params']) => {
  return await limiter.schedule(() => api.get(`address/${addr}/messages`, { params }))
}

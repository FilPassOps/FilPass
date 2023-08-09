import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import nextRouter from 'next/router'

interface Error {
  status: number
  message: string
  [key: string]: any
}

export interface AxiosResponseWithError<T = any, D = any> extends AxiosResponse<T, D> {
  error?: Error
}

export interface Api extends AxiosInstance {
  post<T = any, R = AxiosResponseWithError<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>
  patch<T = any, R = AxiosResponseWithError<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>
  get<T = any, R = AxiosResponseWithError<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>
}

export const api: Api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 200000,
})

api.interceptors.response.use(
  response => response,
  error => {
    let err
    if (error.response) {
      err = {
        ...error.response.data,
        status: error.response.status,
      }
      if (error.response.status === 401 && error.response.config.url !== '/auth/me') {
        nextRouter.push('/login')
      }
    } else if (error.request) {
      err = {
        status: 424,
        message: 'Dependency failed. Please, try again.',
      }
    } else {
      console.log('An unexpected error happened ', error)
      err = {
        status: 500,
        message: 'An unexpected error happened. Please, try again.',
      }
    }
    return Promise.resolve({ error: err })
  }
)

import axios from 'axios'
import config from 'chains.config'
import { logger } from './logger'

export const api = axios.create({
  baseURL: config.chain.rpcUrls[0],
  timeout: 60000,
})

api.interceptors.request.use(
  function (config) {
    // you can do something before request is sent
    return config
  },
  function (error) {
    logger.error('glif api request error', error)
    return Promise.reject({
      status: 503,
      message: 'Glif API is not available. Please, try again later.',
    })
  }
)

api.interceptors.response.use(
  response => {
    if (response.data?.error) {
      return Promise.reject({
        error: {
          status: 400,
          ...response.data.error,
        },
      })
    }
    return response
  },
  error => {
    logger.error('glif api response error', error)
    let err
    if (error.response) {
      err = {
        ...error.response.data,
        status: error.response.status,
      }
    } else if (error.request) {
      err = {
        status: 424,
        message: 'Dependency failed. Please, try again.',
      }
    } else {
      logger.error('An unexpected error happened ', error)
      err = {
        status: 500,
        message: 'An unexpected error happened. Please, try again.',
      }
    }
    return Promise.resolve({ error: err })
  }
)

export const getGasEstimation = (message: unknown) => {
  return api.post('/', {
    id: 0,
    jsonrpc: '2.0',
    method: 'Filecoin.GasEstimateMessageGas',
    params: [message, { MaxFee: '0' }, []],
  })
}

//maybe we can avoid this request by saving the last used nonce
export const getNonce = (address: unknown) => {
  return api.post('/', {
    id: 0,
    jsonrpc: '2.0',
    method: 'Filecoin.MpoolGetNonce',
    params: [address],
  })
}

export const sendTransaction = (signedTransaction: unknown) => {
  return api.post('/', {
    id: 0,
    jsonrpc: '2.0',
    method: 'Filecoin.MpoolPush',
    params: [signedTransaction],
  })
}

export const chainGetMessageId = (messageId: unknown) => {
  return api.post('/', {
    id: 0,
    jsonrpc: '2.0',
    method: 'Filecoin.ChainGetMessage',
    params: [{ '/': messageId }],
  })
}

export const getWalletBalance = (address: unknown) => {
  return api.post('/', {
    id: 0,
    jsonrpc: '2.0',
    method: 'Filecoin.WalletBalance',
    params: [address],
  })
}

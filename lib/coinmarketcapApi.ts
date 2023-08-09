import axios from 'axios'
import { Api } from './api'

const COIN_MARKET_CAP_API_KEY = process.env.COIN_MARKET_CAP_API_KEY
const COIN_MARKET_ENDPOINT = process.env.COIN_MARKET_ENDPOINT

if (!COIN_MARKET_ENDPOINT) {
  throw new Error('Please define COIN_MARKET_ENDPOINT environment variable')
}

if (!COIN_MARKET_CAP_API_KEY) {
  throw new Error('Please define COIN_MARKET_CAP_API_KEY environment variable')
}

export const coinmarketcapApi: Api = axios.create({
  baseURL: COIN_MARKET_ENDPOINT,
  headers: {
    'X-CMC_PRO_API_KEY': COIN_MARKET_CAP_API_KEY,
  },
  timeout: 15000,
})

coinmarketcapApi.interceptors.response.use(
  response => response,
  error => {
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
      console.log('An unexpected error happened ', error)
      err = {
        status: 500,
        message: 'An unexpected error happened. Please, try again.',
      }
    }
    return Promise.resolve({ error: err })
  }
)

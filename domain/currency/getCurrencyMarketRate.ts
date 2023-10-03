import { coinmarketcapApi } from 'lib/coinmarketcapApi'
import { validate } from 'lib/yup'
import { AppConfig, ChainIds } from 'system.config'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { getCurrencyRateFromCoinMarketCapValidator } from './validation'

interface GetCurrencyMarketRateParams {
  chainId: string
}

export async function getCurrencyMarketRate(params: GetCurrencyMarketRateParams) {
  const { fields, errors } = await validate(getCurrencyRateFromCoinMarketCapValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { chainId } = fields

  const chain = AppConfig.network.getChain(chainId as ChainIds)

  if (!chain.coinMarketApiCode) {
    return {
      error: {
        status: 404,
        message: errorsMessages.not_found.message,
      },
    }
  }

  const { data, error: coinmarketcapError } = await coinmarketcapApi.get(`/v2/cryptocurrency/quotes/latest?id=${chain.coinMarketApiCode}`)

  if (coinmarketcapError) {
    return {
      error: {
        status: coinmarketcapError.status,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  const rate = data.data[chain.coinMarketApiCode]?.quote?.USD?.price

  if (!rate) {
    return {
      error: {
        status: 404,
        message: errorsMessages.not_found.message,
      },
    }
  }

  return {
    data: { rate },
  }
}

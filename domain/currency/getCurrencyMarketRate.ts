import { AppConfig, ChainIds } from 'config'
import { coinmarketcapApi } from 'lib/coinmarketcapApi'
import { validate } from 'lib/yup'
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

  if (!AppConfig.app.enableCoinMarketApi) {
    return {
      error: {
        status: 400,
        message: errorsMessages.coinmarketcap_api_not_enabled.message,
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

import { AppConfig } from 'config'
import { coinmarketcapApi } from 'lib/coinmarketcap-api'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { getCurrencyRateFromCoinMarketCapValidator } from './validation'

interface GetCurrencyMarketRateParams {
  tokenIdentifier: string
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

  const { tokenIdentifier } = fields

  const token = AppConfig.network.getTokenByIdentifier(tokenIdentifier)

  if (!token) {
    return {
      error: {
        status: 400,
        errors: {
          tokenIdentifier: 'Token not found',
        },
      },
    }
  }

  if (!token.coinMarketApiCode) {
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

  const { data, error: coinmarketcapError } = await coinmarketcapApi.get(`/v2/cryptocurrency/quotes/latest?id=${token.coinMarketApiCode}`)

  if (coinmarketcapError) {
    return {
      error: {
        status: coinmarketcapError.status,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  const rate = data.data[token.coinMarketApiCode]?.quote?.USD?.price

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

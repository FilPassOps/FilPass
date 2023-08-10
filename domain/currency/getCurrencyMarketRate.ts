import { coinmarketcapApi } from 'lib/coinmarketcapApi'
import { validate } from 'lib/yup'
import { TOKEN } from 'system.config'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { getCurrencyRateFromCoinMarketCapValidator } from './validation'

interface GetCurrencyMarketRateParams {
  name: string
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

  const { name } = fields

  const code = coinMarketCapCurrencyMap[name]

  if (!code) {
    return {
      error: {
        status: 404,
        message: errorsMessages.not_found.message,
      },
    }
  }

  const { data, error: coinmarketcapError } = await coinmarketcapApi.get(`/v2/cryptocurrency/quotes/latest?id=${code}`)

  if (coinmarketcapError) {
    return {
      error: {
        status: coinmarketcapError.status,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  const rate = data.data[code]?.quote?.USD?.price
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

const coinMarketCapCurrencyMap: Record<string, string> = {
  [TOKEN.symbol]: TOKEN.coinMarketApiCode,
}

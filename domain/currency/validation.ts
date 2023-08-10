import { MAX_INTEGER_VALUE } from 'domain/constants'
import yup from 'lib/yup'
import { TOKEN } from 'system.config'
import errorsMessages from 'wordings-and-errors/errors-messages'

export const getCurrencyRateFromCoinMarketCapValidator = yup
  .object({
    name: yup.string().oneOf([TOKEN.symbol]).required(),
  })
  .required()

export const updateCurrencyRateValidator = yup
  .object({
    name: yup.string().oneOf([TOKEN.symbol]).required(),
    rate: yup.number().typeError(errorsMessages.required_field.message).positive().max(MAX_INTEGER_VALUE).required(),
  })
  .required()

export const getCurrencyRateValidator = yup
  .object({
    name: yup.string().oneOf([TOKEN.symbol]).required(),
  })
  .required()

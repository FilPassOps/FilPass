import { MAX_INTEGER_VALUE } from 'domain/constants'
import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

export const getCurrencyRateFromCoinMarketCapValidator = yup
  .object({
    chainId: yup.string().required(),
  })
  .required()

export const updateCurrencyRateValidator = yup
  .object({
    chainId: yup.string().required(),
    rate: yup.number().typeError(errorsMessages.required_field.message).positive().max(MAX_INTEGER_VALUE).required(),
  })
  .required()

export const getCurrencyRateValidator = yup
  .object({
    chainId: yup.string().required(),
  })
  .required()

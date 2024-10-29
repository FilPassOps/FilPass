import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

import { MAX_INTEGER_VALUE } from '../constants'

export const deleteWalletValidator = yup
  .object({
    id: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  })
  .required()

export const setDefaultValidator = yup
  .object({
    token: yup.string().required(),
  })
  .required()

export const getWalletsByUserIdValidator = yup
  .object({
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  })
  .required()

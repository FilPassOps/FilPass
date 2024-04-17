import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { MAX_INTEGER_VALUE } from '../constants'

export const getUserByIdAndEmailValidator = yup
  .object({
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    email: yup.string().email().required(),
  })
  .required()

export const findAllValidator = yup.object({
  sort: yup.string(),
  order: yup.string(),
  size: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message),
  page: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message),
})

export const findAllWithWalletValidator = yup.object({
  size: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message),
  page: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message),
})


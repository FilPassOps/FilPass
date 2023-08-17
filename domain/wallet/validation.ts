import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

import { MAX_INTEGER_VALUE } from '../constants'
import { FILECOIN_BLOCKCHAIN } from './constants'

export const createWalletValidator = yup
  .object({
    name: yup.string(),
    verificationId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message),
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    address: yup.string().required(),
    blockchain: yup.string().oneOf([FILECOIN_BLOCKCHAIN]).required(),
    isDefault: yup.bool(),
    email: yup.string().email().required(),
  })
  .required()

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

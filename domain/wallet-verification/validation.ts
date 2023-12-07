import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

import { MAX_INTEGER_VALUE } from '../constants'

export const sendVerificationTransactionValidator = yup
  .object({
    address: yup.string().required(),
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    blockchain: yup.string().required(), // TODO OPEN-SOURCE: should the id of the blockchain table
  })
  .required()

export const connectWalletStepValidator = yup
  .object({
    address: yup.string().required().max(100),
    blockchain: yup.string().required(), // TODO OPEN-SOURCE: should the id of the blockchain table
    name: yup.string().trim().max(100),
  })
  .required()

export const getWalletVerificationsValidator = yup
  .object({
    address: yup.string().required(),
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  })
  .required()

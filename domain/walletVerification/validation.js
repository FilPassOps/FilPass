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

export const verifyWalletStepValidator = yup
  .object({
    amount: yup.number().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  })
  .required()

export const getWalletVerificationsValidator = yup
  .object({
    address: yup.string().required(),
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  })
  .required()

export const verifyWalletValidator = yup
  .object({
    amount: yup.number().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    unit: yup.string().required(),
    verificationId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    name: yup.string(),
    email: yup.string().email().required(),
  })
  .required()

export const checkVerificationValidator = yup
  .object({
    from: yup.string().required(),
  })
  .required()

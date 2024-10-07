import { MAX_INTEGER_VALUE } from 'domain/constants'
import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import * as Yup from 'yup'

export const getUserTransactionCreditsByUserIdValidator = yup.object({
  userId: yup.number().required(),
})

export const buyTransferCreditsValidator = yup.object({
  amount: yup.number().positive().typeError(errorsMessages.required_field.message).required(),
  storageProviderWallet: yup.string().required(),
})

export const saveTransferCreditsValidator = yup.object({
  amount: yup.string().required(),
  from: yup.string().required(),
  to: yup.string().required(),
  userId: yup.number().required(),
  hash: yup.string().required(),
})

export const getUserCreditsValidator = yup.object({
  userId: yup.number().required(),
  size: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
  page: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
})

export const getUserCreditByIdValidator = yup.object({
  id: yup.number().required(),
  userId: yup.number().required(),
})

export const splitCreditsValidator = yup.object({
  id: yup.number().required(),
  userId: yup.number().required(),
  splitNumber: yup.number().required(),
})

export const splitTokensValidator = yup.object({
  splitNumber: yup.number().positive().typeError(errorsMessages.required_field.message).required(),
})

export const refundCreditsValidator = yup.object({
  id: yup.number().required(),
  userId: yup.number().required(),
})

export const getSplitTokensGroupValidator = Yup.object().shape({
  userCreditId: Yup.number().required('User credit ID is required'),
})

export const getSplitTokensBySplitGroupValidator = Yup.object().shape({
  splitGroup: Yup.string().required(),
  userId: Yup.number().required(),
  userCreditId: Yup.number().required(),
  pageSize: Yup.number().required(),
  page: Yup.number().required(),
})

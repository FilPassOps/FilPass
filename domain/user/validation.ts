import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { MAX_INTEGER_VALUE } from '../constants'

export const getUserByIdAndEmailValidator = yup
  .object({
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    email: yup.string().email().required(),
  })
  .required()

export const getUserByEmailValidator = yup
  .object({
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

export const termsValidator = yup.object({
  transferAuthorization: yup.bool().oneOf([true]).required(),
  walletAddress: yup.bool().oneOf([true]).required(),
  soleControl: yup.bool().oneOf([true]).required(),
  satisfactionOfObligations: yup.bool().oneOf([true]).required(),
  informedDecision: yup.bool().oneOf([true]).required(),
  tax: yup.bool().oneOf([true]).required(),
  release: yup.bool().oneOf([true]).required(),
  sanctions: yup.bool().isTrue().required(),
  transferAuthorizationText: yup.string().required(),
  walletAddressText: yup.string().required(),
  soleControlText: yup.string().required(),
  satisfactionOfObligationsText: yup.string().required(),
  informedDecisionText: yup.string().required(),
  taxText: yup.string().required(),
  releaseText: yup.string().required(),
  sanctionsText: yup.string().required(),
})

export const onboardingValidator = yup.object({
  terms: termsValidator.default(undefined).nullable().notRequired(),
  isOnboarded: yup.boolean(),
})

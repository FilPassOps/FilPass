import { Countries } from 'domain/transferRequest/countries'
import { TODAY, nameRegex } from 'domain/utils'
import yup from 'lib/yup'
import { DateTime } from 'luxon'
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

export const taxFormValidator = yup.object({
  userFileId: yup.string().max(40).typeError(errorsMessages.required_field.message).required(),
  isUSResident: yup
    .boolean()
    .transform(value => (value === 'Yes' ? true : value === 'No' ? false : value))
    .required(),
})

export const personalInformationCheckValidator = yup
  .object({
    firstName: yup.string().min(2, 'Minimum 2 characters').trim().matches(nameRegex, 'No special characters allowed').required(),
    lastName: yup.string().min(2, 'Minimum 2 characters').trim().matches(nameRegex, 'No special characters allowed').required(),
    dateOfBirth: yup
      .date()
      .transform(function (value, originalValue) {
        if (this.isType(originalValue)) return originalValue

        const dateTimeFromIso = DateTime.fromISO(originalValue)
        if (dateTimeFromIso.isValid) return dateTimeFromIso.toJSDate()

        const dateTime = DateTime.fromFormat(originalValue, 'MM/dd/yyyy')
        return dateTime.isValid ? dateTime.toJSDate() : new Date('')
      })
      .max(TODAY)
      .required(),
    countryResidence: yup
      .string()
      .oneOf(
        Countries.map(country => country.value),
        'Insert a valid country'
      )
      .required(),
  })
  .required()

export const onboardingValidator = yup.object({
  pii: personalInformationCheckValidator.default(undefined).nullable().notRequired(),
  terms: termsValidator.default(undefined).nullable().notRequired(),
  taxForm: taxFormValidator.default(undefined).nullable().notRequired(),
  isOnboarded: yup.boolean(),
})

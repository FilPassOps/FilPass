import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

import { MAX_INTEGER_VALUE } from '../constants'

export const loginValidator = yup
  .object({
    password: yup.string().required(),
    email: yup.string().email().required(),
  })
  .required()

export const signupValidator = yup
  .object({
    password: yup
      .string()
      .min(errorsMessages.password_min_length.length as number)
      .required(),
    confirmPassword: yup
      .string()
      .required()
      .oneOf([yup.ref('password')], errorsMessages.confirmation_password.message),
    email: yup.string().email().required(),
  })
  .required()

export const verifyAccountValidator = yup.object({
  token: yup.string().required(),
})

export const resetPasswordValidator = yup
  .object({
    token: yup.string().required(),
    password: yup
      .string()
      .min(errorsMessages.password_min_length.length as number)
      .required(),
    passwordConfirm: yup
      .string()
      .required()
      .oneOf([yup.ref('password')], errorsMessages.confirmation_password.message),
  })
  .required()

export const inviteUserValidator = yup.object({
  email: yup.string().email().required(),
  superAdminId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
})

export const inviteUserValidatorForm = yup.object({
  email: yup.string().email().required(),
})

export const authVerificationValidator = yup.object({
  email: yup.string().email().required(),
  userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
  origin: yup.object(),
})

export const authVerificationPublicValidator = yup.object({
  token: yup.string().required(),
  origin: yup.object(),
})

export const verifyCodeValidator = yup.object({
  code: yup.string().required(),
  token: yup.string().required(),
})

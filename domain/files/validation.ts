import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

import { MAX_INTEGER_VALUE } from '../constants'

export const createFileValidator = yup.object({
  userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).optional(),
  uploaderId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).optional(),
  type: yup.string().oneOf(['W8_FORM', 'W9_FORM', 'ATTACHMENT']).required(),
  setAsActive: yup.boolean().required(),
  file: yup
    .object({
      originalname: yup.string().required(),
    })
    .required(),
})

export const createTemporaryFileValidator = yup.object({
  uploaderId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  type: yup.string().oneOf(['W8_FORM', 'W9_FORM', 'ATTACHMENT']).required(),
  file: yup
    .object({
      originalname: yup.string().required(),
    })
    .required(),
})

export const getFileUrlFromS3Validator = yup.object({
  transferRequestId: yup.string().required(),
  userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
})

export const removeFileValidator = yup.object({
  id: yup.string().max(40).required(),
})

export const getFileValidator = yup.object({
  filePublicId: yup.string().max(40).required(),
})

export const getTempFileValidator = yup.object({
  publicId: yup.string().max(40).required(),
  uploaderId: yup.number().integer().max(MAX_INTEGER_VALUE).required(),
})

export const financeUserFileReviewValidator = yup
  .object({
    taxFormIds: yup
      .array()
      .of(yup.number().required().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message))
      .required(),
    financeUserRoleId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    isApproved: yup.boolean().required(),
    rejectionReason: yup
      .string()
      .trim()
      .when('isApproved', { is: false, then: schema => schema.trim().required() }),
  })
  .required()

import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { MAX_INTEGER_VALUE } from '../constants'

export const createTransfersValidator = yup
  .object({
    requests: yup.array(yup.string().required()).min(1).required(),
    controllerId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
  })
  .required()

export const getTransfersByRequestIdValidator = yup
  .object({
    requests: yup.array(yup.string().required()).min(1).required(),
  })
  .required()

export const transferRejectValidator = yup.object({
  transferRequestId: yup.array(yup.string().required()).typeError(errorsMessages.required_field.message).required(),
  controllerId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  notes: yup.string().required(),
})

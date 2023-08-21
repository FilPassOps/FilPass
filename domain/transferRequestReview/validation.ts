import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { MAX_INTEGER_VALUE } from '../constants'

export const createTransferRequestReviewValidator = yup.object({
  transferRequestId: yup.string().required(),
  approverId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  status: yup.string().required(),
  notes: yup.string(),
})

export const approveTransferRequestValidator = yup.object({
  transferRequestId: yup.string().required(),
  approverId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
})

export const submittedTransferRequestValidator = yup.object({
  transferRequestId: yup.string().required(),
  approverId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
})

export const onHoldTransferRequestValidator = yup.object({
  transferRequestId: yup.string().required(),
  approverId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
})

export const batchApproveTransferRequestValidator = yup.object({
  requests: yup.array(yup.string().required()).min(1).max(50, 'Must have less than or equal to 50 items').required(),
  approverId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
})

export const rejectTransferRequestValidator = yup
  .object({
    transferRequestId: yup.string().required(),
    approverId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    notes: yup.string().required(),
  })
  .required()

export const batchRejectTransferRequestValidator = yup
  .object({
    requests: yup.array(yup.string().required('Request is required')).min(1).max(50, 'Must have less than or equal to 50 items').required(),
    approverId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    notes: yup.string().required(),
  })
  .required()

export const userComplianceReviewValidator = yup
  .object({
    id: yup.number().required(),
    complianceUserRoleId: yup
      .number()
      .integer()
      .positive()
      .max(MAX_INTEGER_VALUE)
      .typeError(errorsMessages.required_field.message)
      .required(),
    isSanctioned: yup.boolean().required(),
  })
  .required()

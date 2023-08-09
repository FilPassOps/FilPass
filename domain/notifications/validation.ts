import { MAX_INTEGER_VALUE } from 'domain/constants'
import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

export const sendRejectNotificationValidator = yup.object({
  email: yup.string().email().required(),
  notes: yup.string().required(),
  transferRequestId: yup.string().required(),
})

export const sendSubmittedNotificationValidator = yup.object({
  programId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  transferRequestId: yup.string().required(),
})

export const sendEmailForgotPasswordValidator = yup.object({
  email: yup.string().email().required(),
})

export const sendEmailVerificationValidator = yup.object({
  email: yup.string().email().required(),
})

export const sendInviteValidator = yup.object({
  email: yup.string().email().required(),
  inviterEmail: yup.string().email().required(),
})

export const sendPaidNotificationValidator = yup.object({
  email: yup.string().email().required(),
  transferRequestId: yup.string().required(),
})

export const sendRequiresChangeNotificationValidator = yup
  .object({
    email: yup.string().email().required(),
    transferRequestId: yup.string().required(),
    notes: yup.string().required(),
  })
  .required()

export const sendApprovedNotificationValidator = yup
  .object({
    encryptedEmail: yup.string().required(),
    transferRequestId: yup.string().required(),
    expectedTransferDate: yup.string().required(),
  })
  .required()

export const sendCreatedNotificationValidator = yup
  .object({
    email: yup.string().email().required(),
    transferRequestId: yup.string().required(),
    expectedTransferDate: yup.string().required(),
  })
  .required()

export const sendCreatedDrafNotificationValidator = yup
  .object({
    email: yup.string().email().required(),
    hasAccount: yup.boolean().required(),
    transferRequestId: yup.string().required(),
    amount: yup.string(),
    programCurrency: yup.array(),
  })
  .required()

export const sendBatchPaidNotificationValidator = yup
  .object({
    publicIds: yup.array(yup.string().required()).min(1).required(),
  })

export const sendSetDefaultWalletConfirmationValidator = yup
  .object({
    id: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    email: yup.string().email().required(),
  })
  .required()

export const sendVerificationCodeValidator = yup.object({
  email: yup.string().email().required(),
  code: yup.string().required(),
})

export const sendWalletVerificationNotificationValidator = yup.object({
  address: yup.string().required(),
  id: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
  email: yup.string().email().required(),
  userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
})

export const sendSanctionNotificationValidator = yup.object({
  userId: yup.number().required(),
  sanctionReason: yup.string().required(),
})

export const sendTaxFormRejectedNotificationValidator = yup.object({
  emails: yup.array(yup.string().required()).min(1).required(),
  rejectionReason: yup.string().required(),
})

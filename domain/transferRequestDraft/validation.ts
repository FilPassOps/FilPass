import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { MAX_INTEGER_VALUE } from '../constants'

export const createTransferRequestDraftValidator = yup
  .object({
    approverRoleId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    requesterId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    requests: yup
      .array(
        yup
          .object({
            receiverEmail: yup.string().required(),
            programId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
            team: yup.string(),
            amount: yup.string(),
            temporaryFileId: yup.string().max(40),
            currencyUnitId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
          })
          .required(),
      )
      .required(),
  })
  .required()

export const createTransferRequestDraftFormValidator = yup
  .object({
    requests: yup
      .array(
        yup
          .object({
            receiverEmail: yup.string().required(),
            programId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
            team: yup.string(),
            amount: yup.string(),
            userAttachmentId: yup.string().max(40),
            currencyUnitId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
          })
          .required(),
      )
      .required(),
  })
  .required()

export const createTransferRequestSubmittedFormValidator = yup
  .object({
    isBatchCsv: yup.boolean(),
    approverRoleId: yup.number().positive().max(MAX_INTEGER_VALUE).optional(),
    requesterId: yup.number().positive().max(MAX_INTEGER_VALUE).optional(),
    requests: yup
      .array(
        yup
          .object({
            receiverEmail: yup.string().required(),
            programId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
            team: yup.string().required(),
            amount: yup.string().required(),
            temporaryFileId: yup.string().max(40),
            currencyUnitId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
            wallet: yup.string(),
            vestingStartEpoch: yup.number(),
            vestingMonths: yup.number(),
            skipWalletCreation: yup.boolean(),
          })
          .required(),
      )
      .required(),
  })
  .required()

export const submitDraftTransferRequestByIdValidator = yup
  .object({
    applyerId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    publicId: yup.string().required(),
    amount: yup.number().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    userAttachmentId: yup.string().max(40).typeError(errorsMessages.required_field.message).optional(),
    programId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    userWalletId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    team: yup.string().required(),
    expectedTransferDate: yup.string().required(),
    currencyUnitId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
  })
  .required()

export const getReceiverDraftTransferRequestByIdValidator = yup
  .object({
    transferRequestId: yup.string().required(),
    receiverId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
  })
  .required()

export const getDraftTransferRequestByIdValidator = yup.object({
  transferRequestId: yup.string().required(),
})

export const deleteDraftTransferRequestByIdValidator = yup.object({
  publicId: yup.string().required(),
  userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
})

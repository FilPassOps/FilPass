import { TransferRequestStatus } from '@prisma/client'
import { statusFilterOptions } from 'components/Filters/constants'
import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

import { MAX_INTEGER_VALUE } from '../constants'
import {
  APPROVED_STATUS,
  DRAFT_STATUS,
  PAID_STATUS,
  PROCESSING_STATUS,
  REJECTED_STATUS,
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_STATUS,
  VOIDED_STATUS,
} from './constants'

export const createTransferRequestValidator = yup.object({
  amount: yup.number().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  userAttachmentId: yup.string().max(40),
  programId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  userWalletId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  team: yup.string().required(),
  expectedTransferDate: yup.string().required(),
  currencyUnitId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
})

export const createTransferRequestValidatorBackend = yup.object({
  amount: yup.number().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  userAttachmentId: yup.string().max(40),
  programId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  userWalletId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  team: yup.string().required(),
  expectedTransferDate: yup.string().required(),
  currencyUnitId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
  user: yup.object({
    id: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    email: yup.string().required(),
    terms: yup.boolean().optional(),
  }),
})

export const getUserTransferRequestByIdValidator = yup
  .object({
    transferRequestId: yup.string().required(),
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    status: yup.mixed().oneOf(Object.values(TransferRequestStatus)).optional(),
  })
  .required()

export const getTransferRequestByIdValidator = yup
  .object({
    transferRequestId: yup.string().required(),
    status: yup.mixed().oneOf(Object.values(TransferRequestStatus)).optional(),
  })
  .required()

export const getViewerTransferRequestsValidator = yup.object({
  viewerId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  programId: yup.array(yup.number().integer().positive().max(MAX_INTEGER_VALUE)).optional(),
  networks: yup.array(yup.string().required()).optional(),
  requestNumber: yup.string().optional(),
  teamHashes: yup.array(yup.string().required()).optional(),
  from: yup.date().optional(),
  to: yup.date().when('from', {
    is: (from: Date) => !!from,
    then: schema => schema.required(),
    otherwise: schema => schema.optional(),
  }),
  wallets: yup.array(yup.string().required()).optional(),
  page: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
  size: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
  sort: yup.mixed().oneOf(['number', 'program', 'create_date']),
  order: yup.mixed().oneOf(['asc', 'desc']),
})

export const getApproverTransferRequestsValidator = yup.object({
  approverId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
  status: yup
    .string()
    .oneOf([
      REJECTED_STATUS,
      SUBMITTED_STATUS,
      APPROVED_STATUS,
      PAID_STATUS,
      REQUIRES_CHANGES_STATUS,
      VOIDED_STATUS,
      DRAFT_STATUS,
      PROCESSING_STATUS,
    ])
    .required(),
  programId: yup.array(yup.number().integer().positive().max(MAX_INTEGER_VALUE)).optional(),
  networks: yup.array(yup.string().required()).optional(),
  requestNumber: yup.string().optional(),
  teamHashes: yup.array(yup.string().required()).optional(),
  from: yup.date().optional(),
  to: yup.date().when('from', {
    is: (from: Date) => !!from,
    then: schema => schema.required(),
    otherwise: schema => schema.optional(),
  }),
  wallets: yup.array(yup.string().required()).optional(),
  page: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
  size: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
  sort: yup.string(),
  order: yup.string(),
})

export const getUserTransferRequestsValidator = yup
  .object({
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    programIds: yup.array(yup.number().integer().positive().max(MAX_INTEGER_VALUE)).optional(),
    networks: yup.array(yup.string().required()).optional(),
    requestNumber: yup.string().optional(),
    status: yup.string().oneOf(statusFilterOptions).optional(),
    team: yup.array(yup.string().required()).optional(),
    from: yup.date().optional(),
    to: yup.date().when('from', {
      is: (from: Date) => !!from,
      then: schema => schema.required(),
      otherwise: schema => schema.optional(),
    }),
    wallets: yup.array(yup.string()).optional(),
    page: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
    size: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
    sort: yup.string(),
    order: yup.string(),
  })
  .required()

export const updateTransferRequestValidator = yup
  .object({
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    transferRequestId: yup.string().required(),
    amount: yup.number().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    userAttachmentId: yup.string().max(40),
    programId: yup.number().typeError(errorsMessages.required_field.message).required(),
    userWalletId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).typeError(errorsMessages.required_field.message).required(),
    team: yup.string().required(),
    expectedTransferDate: yup.string().required(),
    currencyUnitId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
  })
  .required()

export const voidTransferRequestValidator = yup.object({
  transferRequestId: yup.string().required(),
  userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
})

export const uploadBatchCsvValidator = yup
  .object({
    programId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    approverId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    file: yup
      .object({
        fieldname: yup.string().required(),
        originalname: yup.string().required(),
        encoding: yup.string().required(),
        mimetype: yup.string().required(),
        destination: yup.string().required(),
        filename: yup.string().required(),
        path: yup.string().required(),
        size: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
      })
      .required(),
  })
  .required()

export const csvSchemaV1 = yup.object().shape({
  Email: yup.string().defined(),
  Amount: yup.string().defined(),
})

export const csvSchemaV2 = yup.object().shape({
  Email: yup.string().defined(),
  Amount: yup.string().defined(),
  ApprovalForTransfer: yup.string().defined(),
  Custodian: yup.string().required(),
})

export const deleteTransferRequestValidator = yup.object({
  requests: yup.array(yup.string()).min(1).max(100, 'Must have less than or equal to 100 items').required(),
})

export const payloadContainsRequesterEmail = (payload: Array<{ receiverEmail: string }>, requester: { email: string }) => {
  const errors: { [key: number]: { receiverEmail: string } } = {}
  payload.forEach(({ receiverEmail }, index) => {
    if (receiverEmail.toLocaleLowerCase().trim() === requester.email.toLocaleLowerCase().trim()) {
      errors[index] = {
        receiverEmail: errorsMessages.applying_for_others_unchek.message,
      }
    }
  })

  return errors
}

export const createReportValidator = yup.object({
  pageSelected: yup
    .string()
    .matches(/(SINGLE_PAGE|ALL)/)
    .required(),
  columns: yup
    .object({
      number: yup.boolean().required(),
      program: yup.boolean().required(),
      name: yup.boolean().required(),
      createDate: yup.boolean().required(),
      address: yup.boolean().required(),
      amount: yup.boolean().required(),
      paidAmount: yup.boolean().required(),
      status: yup.boolean().required(),
      receiverEmail: yup.boolean().required(),
      blockExplorerLink: yup.boolean().required(),
    })
    .test('oneColumnRequired', 'Select at least one column', value => Object.values(value).includes(true)),
})

import { DeliveryMethod, ProgramCurrencyType, ProgramVisibility } from '@prisma/client'
import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

import { MAX_INTEGER_VALUE } from '../constants'
import { ONE_TIME, PROGRAM_TYPE_EXTERNAL, PROGRAM_TYPE_INTERNAL } from './constants'

export const createProgramValidator = yup
  .object({
    name: yup.string().required(),
    deliveryMethod: yup.mixed<DeliveryMethod>().oneOf([ONE_TIME]).required(),
    approversRole: yup
      .array()
      .min(1, errorsMessages.required_field.message)
      .of(
        yup
          .array()
          .min(1, errorsMessages.required_field.message)
          .of(
            yup
              .object({
                roleId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
              })
              .required(),
          )
          .required(),
      )
      .required(),
    viewersRole: yup.array().of(yup.object({ roleId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required() }).required()),
    programCurrency: yup
      .array()
      .min(1, errorsMessages.required_field.message)
      .of(
        yup
          .object({
            name: yup.string().required(),
            type: yup.mixed<ProgramCurrencyType>().oneOf(['REQUEST', 'PAYMENT']).required(),
            blockchain: yup.string().required(),
          })
          .required(),
      )
      .required(),
    visibility: yup.mixed<ProgramVisibility>().oneOf([PROGRAM_TYPE_EXTERNAL, PROGRAM_TYPE_INTERNAL]).required(),
  })
  .required()

export const createProgramFormValidator = yup
  .object({
    paymentMethod: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    name: yup.string().required(),
    deliveryMethod: yup.mixed<DeliveryMethod>().oneOf([ONE_TIME]).required(),
    visibility: yup.string().oneOf([PROGRAM_TYPE_EXTERNAL, PROGRAM_TYPE_INTERNAL]).required(),
    approversRole: yup
      .array()
      .min(1, errorsMessages.required_field.message)
      .of(
        yup
          .array()
          .min(1, errorsMessages.required_field.message)
          .of(
            yup
              .object({
                roleId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
              })
              .required(),
          )
          .required(),
      )
      .required(),
    viewersRole: yup.array().of(yup.object({ roleId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required() }).required()),
    programCurrency: yup
      .array()
      .min(1, errorsMessages.required_field.message)
      .of(
        yup
          .object({
            name: yup.string().required(),
            type: yup.mixed<ProgramCurrencyType>().oneOf(['REQUEST', 'PAYMENT']).required(),
          })
          .required(),
      )
      .required(),
  })
  .required()

export const archiveProgramValidator = yup
  .object({
    id: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    isArchived: yup.bool().optional(),
  })
  .required()

export const updateProgramValidator = yup
  .object({
    approversRole: yup
      .array()
      .min(1, errorsMessages.required_field.message)
      .of(
        yup
          .array()
          .min(1, errorsMessages.required_field.message)
          .of(
            yup
              .object({
                roleId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
              })
              .required(),
          )
          .required(),
      )
      .required(),
    viewersRole: yup.array().of(yup.object({ roleId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required() }).required()),
    id: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    programCurrency: yup
      .array()
      .min(1, errorsMessages.required_field.message)
      .of(
        yup
          .object({
            name: yup.string().required(),
            type: yup.mixed<ProgramCurrencyType>().oneOf(['REQUEST', 'PAYMENT']).required(),
          })
          .required(),
      )
      .required(),
    name: yup.string().required(),
    deliveryMethod: yup.mixed<DeliveryMethod>().oneOf([ONE_TIME]).required(),
    visibility: yup.mixed<ProgramVisibility>().oneOf([PROGRAM_TYPE_EXTERNAL, PROGRAM_TYPE_INTERNAL]).required(),
    updateApprovers: yup.bool().optional().default(false),
    updateViewers: yup.bool().optional().default(false),
    isArchived: yup.bool().optional().default(false),
  })
  .required()

export const programAssociatedRequestsValidator = yup
  .object({
    programId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
  })
  .required()

export const findAllProgramsCompleteValidator = yup.object({
  archived: yup.bool(),
  size: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
  page: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
})

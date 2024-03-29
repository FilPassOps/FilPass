import { ProgramVisibility } from '@prisma/client'
import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'

import { MAX_INTEGER_VALUE } from '../constants'
import { PROGRAM_TYPE_EXTERNAL, PROGRAM_TYPE_INTERNAL, REQUEST_TOKEN } from './constants'
import { USD } from 'domain/currency/constants'

export const createProgramValidator = yup
  .object({
    name: yup.string().required(),
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
    visibility: yup.mixed<ProgramVisibility>().oneOf([PROGRAM_TYPE_EXTERNAL, PROGRAM_TYPE_INTERNAL]).required(),
    requestType: yup.string().oneOf(['USD', 'TOKEN']).required(),
    paymentToken: yup.string().required(),
  })
  .required()

export const createProgramFormValidator = yup
  .object({
    name: yup.string().required(),
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
    requestType: yup.string().oneOf([USD, REQUEST_TOKEN]).required(),
    paymentToken: yup.string().required(),
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
    name: yup.string().required(),
    visibility: yup.mixed<ProgramVisibility>().oneOf([PROGRAM_TYPE_EXTERNAL, PROGRAM_TYPE_INTERNAL]).required(),
    updateApprovers: yup.bool().optional().default(false),
    updateViewers: yup.bool().optional().default(false),
    isArchived: yup.bool().optional().default(false),
    requestType: yup.string().oneOf(['USD', 'TOKEN']).required(),
    paymentToken: yup.string().required(),
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

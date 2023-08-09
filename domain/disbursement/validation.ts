import { APPROVED_STATUS, PAID_STATUS, REJECTED_BY_CONTROLLER_STATUS } from 'domain/transferRequest/constants'
import yup from 'lib/yup'
import { MAX_INTEGER_VALUE } from '../constants'

export const getControllerTransferRequestsValidator = yup.object({
  status: yup.string().oneOf([REJECTED_BY_CONTROLLER_STATUS, APPROVED_STATUS, PAID_STATUS]).required(),
  programId: yup.array(yup.number().integer().positive().max(MAX_INTEGER_VALUE)).optional(),
  requestNumber: yup.string().optional(),
  wallet: yup.string().optional(),
  team: yup.array(yup.string().required()).optional(),
  from: yup.date().optional(),
  to: yup.date().when('from', {
    is: (from: Date) => !!from,
    then: schema => schema.required(),
    otherwise: schema => schema.optional(),
  }),
  page: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
  size: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
  sort: yup.string(),
  order: yup.string(),
})

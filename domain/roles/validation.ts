import yup from 'lib/yup'
import { MAX_INTEGER_VALUE } from '../constants'

export const updateRolesValidator = yup
  .object({
    userId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
    roles: yup
      .array()
      .of(
        yup.object({
          value: yup.string().required(),
        })
      )
      .required(),
  })
  .required()

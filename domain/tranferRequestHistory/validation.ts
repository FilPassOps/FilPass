import yup from 'lib/yup'

export const getHistoryValidator = yup
  .object({
    transferRequestId: yup.string().required(),
  })
  .required()

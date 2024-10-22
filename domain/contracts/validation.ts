import yup from 'lib/yup'

export const getContractsByUserIdValidator = yup.object({
  userId: yup.number().required(),
})

export const getPendingContractTransactionValidator = yup.object({
  userId: yup.number().required(),
})

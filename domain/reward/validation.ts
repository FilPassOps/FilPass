import yup from 'lib/yup'

export const sendMetaMaskConnectionRewardValidation = yup
  .object({
    address: yup.string().required(),
  })
  .required()

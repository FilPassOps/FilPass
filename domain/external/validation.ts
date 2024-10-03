import yup from 'lib/yup'

export const redeemTokenValidator = yup.object({
  walletAddress: yup.string().required(),
  token: yup.string().required(),
})

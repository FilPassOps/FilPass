import yup from 'lib/yup'

export const redeemTokenValidator = yup.object({
  token: yup.string().required(),
})

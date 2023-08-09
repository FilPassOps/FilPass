import yup from 'lib/yup'

export const subscribeNewsletterValidator = yup.object({
  email: yup.string().trim().email().required(),
})

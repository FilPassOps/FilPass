import yup from 'lib/yup'

export const submitTicketValidator = yup.object({
  token: yup.string().required(),
})

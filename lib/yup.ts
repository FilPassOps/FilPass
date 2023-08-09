import errorsMessages from 'wordings-and-errors/errors-messages'
import * as yup from 'yup'

yup.setLocale({
  mixed: {
    required: errorsMessages.required_field.message,
    notType: errorsMessages.required_field.message,
  },
  number: {
    positive: errorsMessages.positive_number.message,
  },
  boolean: {
    isValue: errorsMessages.checked_field.message,
  },
  string: {
    email: errorsMessages.email_must_be_valid.message,
    min: errorsMessages.password_min_length.message,
  },
})

export default yup

export async function validate<S extends yup.AnyObjectSchema>(validationSchema: S, value: any) {
  try {
    const fields = await validationSchema.validate(value, { abortEarly: false })
    return { fields }
  } catch (error: unknown) {
    console.log(error)
    if (error instanceof yup.ValidationError) {
      if (error.inner.length > 0) {
        const errors = error.inner.reduce(
          (errors, error) => ({
            ...errors,
            [error.path || error.name]: {
              message: error.message,
            },
          }),
          {}
        )
        return { errors }
      }
      return {
        errors: {
          [error.path || error.name]: {
            message: error.message,
          },
        },
      }
    }
    return {
      errors: error,
    }
  }
}

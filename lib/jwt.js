import jwt from 'jsonwebtoken'
import errorsMessages from 'wordings-and-errors/errors-messages'

export const verify = (value) => {
  try {
    return { data: jwt.verify(value, process.env.APP_SECRET) }
  } catch (err) {
    return { error: errorsMessages.invalid_token}
  }
}

export const sign = (value, options) => {
  return jwt.sign(value, process.env.APP_SECRET, options)
}
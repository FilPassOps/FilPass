import jwt, { SignOptions } from 'jsonwebtoken'
import errorsMessages from 'wordings-and-errors/errors-messages'

export const verify = (value: string) => {
  try {
    return { data: jwt.verify(value, process.env.APP_SECRET as string) as any }
  } catch (err) {
    return { error: errorsMessages.invalid_token }
  }
}

export const sign = (value: string, options: SignOptions & { algorithm: 'none' }) => {
  return jwt.sign(value, process.env.APP_SECRET as string, options)
}

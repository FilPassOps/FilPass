import jwt, { SignOptions } from 'jsonwebtoken'
import errorsMessages from 'wordings-and-errors/errors-messages'

export const verify = (value: string, secretOrPublicKey?: string) => {
  try {
    return { data: jwt.verify(value, secretOrPublicKey || (process.env.APP_SECRET as string)) as any }
  } catch (err) {
    return { error: errorsMessages.invalid_token }
  }
}

export const sign = (value: any, secretOrPrivateKey?: string, options?: SignOptions) => {
  return jwt.sign(value, secretOrPrivateKey || (process.env.APP_SECRET as string), options)
}

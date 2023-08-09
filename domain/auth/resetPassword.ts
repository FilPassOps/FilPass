import prisma from 'lib/prisma'
import jwt from 'jsonwebtoken'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { resetPasswordValidator } from './validation'
import { generateEmailHash, generatePasswordHash } from 'lib/password'

interface ResetPasswordParams {
  token: string
  password: string
  passwordConfirm: string
}

export async function resetPassword(params: ResetPasswordParams) {
  const { fields, errors } = await validate(resetPasswordValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { token, password } = fields
  let userEmail

  const secret = process.env.APP_SECRET

  if (!secret) {
    return {
      error: {
        status: 500,
        errors: [errorsMessages.something_went_wrong.message],
      },
    }
  }

  try {
    const decoded = jwt.verify(token, secret) as { email: string }
    userEmail = decoded.email
  } catch (error) {
    console.log('Error verifying token. ', JSON.stringify(error))
    return {
      error: {
        status: 400,
        errors: { token: { message: errorsMessages.invalid_token.message } },
      },
    }
  }

  try {
    const emailHash = await generateEmailHash(userEmail)
    const pwdHash = await generatePasswordHash(password)

    const user = await prisma.user.findFirst({ where: { isActive: true, emailHash } })

    if (!user) {
      return {
        error: {
          status: 404,
          errors: {
            token: { message: errorsMessages.something_went_wrong.message },
          },
        },
      }
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: pwdHash,
      },
    })
    return {}
  } catch (error) {
    return {
      error: {
        status: 404,
        errors: {
          token: { message: errorsMessages.something_went_wrong.message },
        },
      },
    }
  }
}

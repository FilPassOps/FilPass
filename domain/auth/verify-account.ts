import prisma from 'lib/prisma'
import jwt from 'jsonwebtoken'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { verifyAccountValidator } from './validation'
import { generateEmailHash } from 'lib/password'
import { logger } from 'lib/logger'

interface VerifyAccountParams {
  token?: string
}

export async function verifyAccount(params: VerifyAccountParams) {
  const { fields, errors } = await validate(verifyAccountValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { token } = fields
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
    logger.error('Error verifying token. ', error)
    return {
      error: {
        status: 400,
        errors: { token: { message: errorsMessages.invalid_token.message } },
      },
    }
  }

  try {
    const user = await prisma.user.findFirst({
      where: { isActive: true, isVerified: false, emailHash: await generateEmailHash(userEmail) },
    })
    if (!user) {
      return {
        error: {
          status: 404,
          errors: {
            token: { message: errorsMessages.account_not_found_or_already_verified.message },
          },
        },
      }
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isVerified: true,
      },
    })
    return { data: { active: true } }
  } catch (error) {
    return {
      error: {
        status: 404,
        errors: {
          token: { message: errorsMessages.account_not_found_or_already_verified.message },
        },
      },
    }
  }
}

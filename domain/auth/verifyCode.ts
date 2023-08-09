import { validate } from 'lib/yup'
import { verifyCodeValidator } from './validation'
import prisma from 'lib/prisma'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { DateTime } from 'luxon'
import { verify } from 'lib/jwt'

interface VerifyCodeParams {
  code: string
  token: string
}

export const verifyCode = async (params: VerifyCodeParams) => {
  const { fields, errors } = await validate(verifyCodeValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }
  const { code, token } = fields

  const { data: user, error } = verify(token)

  if (error) {
    return {
      error: {
        status: 400,
        ...error,
      },
    }
  }

  await prisma.authVerification.updateMany({
    where: { userId: user.id },
    data: {
      triesCount: {
        increment: 1,
      },
    },
  })

  const data = await prisma.authVerification.findUnique({
    where: {
      userId_code: { userId: user.id, code },
    },
  })

  if (!data) {
    return {
      error: {
        status: 404,
        message: errorsMessages.auth_code_not_found.message,
      },
    }
  }

  const currentTime = DateTime.now()
  const generatedTime = DateTime.fromJSDate(data.createdAt)
  const diffValue = currentTime.diff(generatedTime, ['minutes'])
  if (diffValue.minutes > 9 || data.triesCount > 10) {
    return {
      error: {
        status: 400,
        message: errorsMessages.auth_code_expired.message,
      },
    }
  }

  await prisma.authVerification.deleteMany({
    where: { userId: user.id },
  })

  return {
    data: {
      user,
    },
  }
}

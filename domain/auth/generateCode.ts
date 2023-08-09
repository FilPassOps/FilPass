import { sendVerificationCodeNotification } from 'domain/notifications/sendVerificationCodeNotification'
import prisma from 'lib/prisma'
import { random } from 'lodash'
import { validate } from 'lib/yup'
import { authVerificationValidator, authVerificationPublicValidator } from './validation'
import { verify } from 'lib/jwt'
import { DateTime } from 'luxon'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface GenerateCodeParams {
  email: string
  userId: number
  origin: object
}

interface GenerateCodePublicParams {
  token: string
}

const isDevelopmentEnv = process.env.ENV_NAME === 'development'

export async function generateCode(params: GenerateCodeParams) {
  const { fields, errors } = await validate(authVerificationValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { email, userId } = fields

  const code = isDevelopmentEnv ? '1234' : `${random(1, 9)}${random(1, 9)}${random(1, 9)}${random(1, 9)}`

  const generatedCode = await prisma.authVerification.upsert({
    where: { userId_code: { userId: userId, code } },
    create: { code, userId, origin: {} },
    update: { code, userId, origin: {}, triesCount: 0 },
  })

  return await sendVerificationCodeNotification({ email, code: generatedCode.code })
}

export async function generateCodePublic(params: GenerateCodePublicParams) {
  const { fields, errors } = await validate(authVerificationPublicValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { token } = fields

  const { data: user, error } = verify(token)

  if (error) {
    return {
      error: {
        status: 400,
        ...error,
      },
    }
  }

  const firstCode = await prisma.authVerification.findFirst({
    where: { userId: user.id },
    orderBy: { id: 'desc' },
  })

  if (firstCode) {
    const currentTime = DateTime.now()
    const generatedTime = DateTime.fromJSDate(firstCode.createdAt)
    const diffValue = currentTime.diff(generatedTime, ['minutes'])

    if (diffValue.minutes < 1) {
      return {
        error: {
          status: 404,
          message: errorsMessages.auth_code_cant_generate.message,
        },
      }
    }
  }

  const code = isDevelopmentEnv ? '1234' : `${random(1, 9)}${random(1, 9)}${random(1, 9)}${random(1, 9)}`

  const generatedCode = await prisma.authVerification.upsert({
    where: { userId_code: { userId: user.id, code } },
    create: { code, userId: user.id, origin: {} },
    update: { code, userId: user.id, origin: {}, triesCount: 0 },
  })

  return await sendVerificationCodeNotification({ email: user.email, code: generatedCode.code })
}

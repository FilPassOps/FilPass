import { comparePassword, generateEmailHash } from 'lib/password'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { loginValidator } from './validation'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { generateCode } from './generateCode'
import { sign } from 'lib/jwt'

interface LoginParams {
  email: string
  password: string
}

export async function login(params: LoginParams) {
  const { fields, errors } = await validate(loginValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { password, email } = fields

  const user = await prisma.user.findFirst({
    where: {
      isActive: true,
      emailHash: await generateEmailHash(email),
    },
    include: {
      roles: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  })

  if (!user) {
    return wrongCredentials
  }

  if (!user.isVerified) {
    return {
      error: {
        status: 400,
        errors: {
          verification: {
            message: errorsMessages.email_is_not_verified.message,
          },
        },
      },
    }
  }

  // Verify if it's a Google Account
  if (!user.password) {
    return wrongCredentials
  }

  const passwordMatch = await comparePassword({ password, hash: user.password })

  if (!passwordMatch) {
    return wrongCredentials
  }

  await generateCode({
    email,
    userId: user.id,
    origin: {},
  })

  const token = sign({
    id: user.id,
    email: user.email,
    roles: user.roles,
  })

  return { data: { token } }
}

const wrongCredentials = {
  error: {
    status: 400,
    errors: {
      email: {
        message: errorsMessages.wrong_credentials.message,
      },
      password: {
        message: errorsMessages.wrong_credentials.message,
      },
    },
  },
}

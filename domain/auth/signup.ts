import { encryptPII } from 'lib/emissary-crypto'
import { generateEmailHash, generatePasswordHash } from 'lib/password'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { sendEmailVerification } from '../notifications/send-email-verification'
import { signupValidator } from './validation'

interface SignupParams {
  email: string
  password: string
  confirmPassword: string
}

export async function signup(params: SignupParams) {
  const { fields, errors } = await validate(signupValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { password, email } = fields

  // Prevent user from signing up with an existing email - even with variants
  const [startsWith, endsWith] = email.replace(/\+.*@/, '@').split('@')

  const [userFound] = (
    await prisma.user.findMany({
      where: {
        isActive: true,
      },
    })
  ).filter(usr => {
    const [emailStart, emailEnd] = usr.email.replace(/\+.*@/, '@').split('@')
    return emailStart.match(startsWith) && emailEnd.match(endsWith)
  })

  if (userFound && !userFound?.isDraft) {
    return {
      error: {
        status: 400,
        errors: {
          email: {
            message: errorsMessages.email_in_use.message,
          },
        },
      },
    }
  }

  return await newPrismaTransaction(async fnPrisma => {
    const pwdHash = await generatePasswordHash(password)

    await fnPrisma.user.upsert({
      where: {
        id: userFound?.id || -1,
      },
      update: {
        isDraft: false,
        password: pwdHash,
      },
      create: {
        email: await encryptPII(email),
        emailHash: await generateEmailHash(email),
        password: pwdHash,
        terms: true,
        roles: {
          createMany: {
            data: [
              {
                role: 'USER',
              },
            ],
          },
        },
      },
    })

    const { error } = await sendEmailVerification({ email })

    if (error) {
      // @ts-ignore
      if (error.errors.email.message) {
        // @ts-ignore
        throw Error(error.errors.email.message)
      } else {
        throw Error(errorsMessages.something_went_wrong.message)
      }
    }

    return
  })
}

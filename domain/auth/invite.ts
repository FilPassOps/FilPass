import { Role } from '@prisma/client'
import { sendInviteNotification } from 'domain/notifications/sendInviteNotification'
import { encryptPII } from 'lib/emissaryCrypto'
import { generateEmailHash } from 'lib/password'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { inviteUserValidator } from './validation'

interface InviteParams {
  email: string
  superAdminId: number
}

export async function invite(params: InviteParams) {
  const { fields, errors } = await validate(inviteUserValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { email, superAdminId } = fields

  const user = await prisma.user.findFirst({ where: { isActive: true, emailHash: await generateEmailHash(email) } })

  if (user) {
    return {
      error: {
        status: 400,
        message: errorsMessages.user_already_invited.message,
      },
    }
  }

  const [inviter] = await prisma.userRole.findMany({
    where: {
      isActive: true,
      id: superAdminId,
    },
    select: {
      user: {
        select: {
          id: true,
        },
      },
    },
  })
  const inviterUser = await prisma.user.findUnique({ where: { id: inviter?.user?.id } })

  if (!inviterUser) {
    return {
      error: {
        status: 400,
        message: `${errorsMessages.user_not_found.message} - inviter`,
      },
    }
  }

  return await newPrismaTransaction(async fnPrisma => {
    const data = await fnPrisma.user.create({
      data: {
        email: await encryptPII(email),
        emailHash: await generateEmailHash(email),
        isDraft: true,
        roles: {
          createMany: {
            data: [{ role: Role.USER }],
          },
        },
      },
    })

    const { error } = await sendInviteNotification({ email, inviterEmail: inviterUser.email })

    return { data, error }
  })
}

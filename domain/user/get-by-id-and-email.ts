import { Prisma } from '@prisma/client'
import { generateEmailHash } from 'lib/password'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { getUserByIdAndEmailValidator } from './validation'

interface GetUserByIdAndEmailParams {
  userId?: number
  email?: string
}

const select = {
  id: true,
  email: true,
  terms: true,
  isBanned: true,
  roles: {
    where: {
      isActive: true,
    },
    select: {
      id: true,
      role: true,
    },
  },
  wallets: {
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      address: true,
      blockchain: {
        select: {
          id: true,
          name: true,
        },
      },
      verification: {
        select: {
          id: true,
          isVerified: true,
        },
      },
    },
    orderBy: {
      createdAt: Prisma.SortOrder.asc,
    },
  },
}

export type UserResult = Prisma.UserGetPayload<{ select: typeof select }>

export async function getUserByIdAndEmail(params: GetUserByIdAndEmailParams) {
  const { fields, errors } = await validate(getUserByIdAndEmailValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { userId, email } = fields

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true,
      emailHash: await generateEmailHash(email),
    },
    select: select,
  })

  if (!user) {
    return {
      error: {
        status: 404,
        errors: {
          message: 'User not found',
        },
      },
    }
  }
  return {
    data: {
      ...user,
      files: undefined,
    },
  }
}

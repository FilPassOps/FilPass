import { Prisma } from '@prisma/client'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { generateEmailHash } from 'lib/password'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { orderBy } from 'lodash'
import { getUserByIdAndEmailValidator } from './validation'

interface GetUserByIdAndEmailParams {
  userId?: number
  email?: string
}

const select = {
  id: true,
  email: true,
  isOnboarded: true,
  terms: true,
  isBanned: true,
  roles: {
    where: {
      isActive: true,
    },
    select: {
      id: true,
      role: true,
      userRolePrograms: {
        select: {
          isActive: true,
          program: {
            include: {
              programCurrency: {
                select: {
                  currency: true,
                  type: true,
                },
              },
            },
          },
        },
      },
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
      blockchain: true,
      isDefault: true,
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

export async function findUserByIdAndEmail(params: GetUserByIdAndEmailParams) {
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

  const getApproverPrograms = () => {
    const approverRole = user?.roles.find(r => r.role === APPROVER_ROLE)
    const approverPrograms = approverRole?.userRolePrograms?.filter(p => p.isActive) || []
    return orderBy(
      approverPrograms.map(p => p.program).filter(p => p.isArchived === false),
      ['name'],
      ['asc']
    )
  }

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
      approverPrograms: getApproverPrograms(),
    },
  }
}

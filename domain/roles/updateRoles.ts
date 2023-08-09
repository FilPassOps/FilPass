import { USER_ROLE } from 'domain/auth/constants'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { updateRolesValidator } from './validation'
import { Prisma, Role } from '@prisma/client'

interface UpdateRolesParams {
  userId: number
  roles: Array<{ value: string }>
}

interface SeparateRolesByExistenceParams {
  fnPrisma: Prisma.TransactionClient
  userId: number
  roles: Array<{ value: string }>
}

interface ResetUserRolesParams {
  fnPrisma: Prisma.TransactionClient
  userId: number
}

interface ActivateExistingUserRolesParams {
  fnPrisma: Prisma.TransactionClient
  userId: number
  existingRoles: Role[]
}

interface AddUserRolesParams {
  fnPrisma: Prisma.TransactionClient
  userId: number
  newRoles: Role[]
}

export async function updateRoles(params: UpdateRolesParams) {
  const { fields, errors } = await validate(updateRolesValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { userId, roles } = fields

  return newPrismaTransaction(async fnPrisma => {
    const { existingRoles, newRoles } = await seperateRolesbyExistence({ fnPrisma, userId, roles })
    await resetUserRoles({ fnPrisma, userId })
    await activateExistingUserRoles({ fnPrisma, userId, existingRoles })
    await addUserRoles({ fnPrisma, userId, newRoles })
    return roles
  })
}

async function seperateRolesbyExistence({ fnPrisma, userId, roles }: SeparateRolesByExistenceParams) {
  // get existing roles
  const currentRoles = await fnPrisma.userRole.findMany({
    where: {
      userId,
      role: {
        not: USER_ROLE,
      },
    },
    select: {
      id: true,
      role: true,
    },
  })

  const currentRoleValues = currentRoles.map(({ role }: { role: Role }) => role)

  const { existingRoles, newRoles } = roles.reduce(
    (updatedRoles, { value }) => {
      if (currentRoleValues.includes(value as Role)) {
        updatedRoles.existingRoles.push(value as Role)
      } else {
        updatedRoles.newRoles.push(value as Role)
      }
      return updatedRoles
    },
    { existingRoles: [], newRoles: [] } as { existingRoles: Array<Role>; newRoles: Array<Role> }
  )

  return { existingRoles, newRoles }
}

async function resetUserRoles({ fnPrisma, userId }: ResetUserRolesParams) {
  // reset all existing privileged roles to inActive = false
  await fnPrisma.userRole.updateMany({
    where: {
      userId,
      role: {
        not: USER_ROLE,
      },
    },
    data: {
      isActive: false,
    },
  })
}

async function activateExistingUserRoles({ fnPrisma, userId, existingRoles }: ActivateExistingUserRolesParams) {
  // set existing roles to active
  if (existingRoles.length > 0) {
    await fnPrisma.userRole.updateMany({
      where: {
        userId,
        role: { in: existingRoles },
      },
      data: {
        isActive: true,
      },
    })
  }
}

async function addUserRoles({ fnPrisma, userId, newRoles }: AddUserRolesParams) {
  // create new roles
  if (newRoles.length > 0) {
    await fnPrisma.userRole.createMany({
      data: newRoles.map(role => ({
        userId,
        role,
        isActive: true,
      })),
    })
  }
}

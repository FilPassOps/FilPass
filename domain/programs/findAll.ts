import { Role, TransferRequestStatus } from '@prisma/client'
import { decryptPII } from 'lib/emissaryCrypto'
import prisma, { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import { chain } from 'lodash'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { PROGRAM_TYPE_INTERNAL } from './constants'
import { findAllProgramsCompleteValidator } from './validation'

interface FindAllProgramsProps {
  archived: boolean
}

export async function findAllPrograms({ archived = false }: FindAllProgramsProps) {
  const filter = archived
    ? { isArchived: true }
    : {
        OR: [
          { isArchived: false },
          {
            isArchived: true,
            transferRequests: {
              some: {
                status: { in: [TransferRequestStatus.APPROVED, TransferRequestStatus.REJECTED_BY_CONTROLLER, TransferRequestStatus.PAID] },
              },
            },
          },
        ],
      }

  const programs = await prisma.program.findMany({
    where: {
      isActive: true,
      ...filter,
    },
    include: {
      programCurrency: {
        select: {
          currency: true,
          type: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  if (!programs) {
    return {
      error: {
        status: 404,
        errors: {
          programs: {
            message: `Programs ${errorsMessages.not_found}`,
          },
        },
      },
    }
  }

  return {
    data: programs,
  }
}

export async function findAllExternalPrograms() {
  const prisma = await getPrismaClient()

  const programs = await prisma.program.findMany({
    where: {
      isActive: true,
      isArchived: false,
      visibility: { not: PROGRAM_TYPE_INTERNAL },
    },
    include: {
      programCurrency: {
        select: {
          currency: true,
          type: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  if (!programs) {
    return {
      error: {
        status: 404,
        errors: {
          programs: {
            message: `Programs ${errorsMessages.not_found}`,
          },
        },
      },
    }
  }

  return {
    data: programs,
  }
}

export async function findAllProgramsComplete(params: any) {
  const { fields, errors } = await validate(findAllProgramsCompleteValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }
  const { archived = false, size = 100, page = 1 } = fields
  const currentPage = page - 1 < 0 ? 0 : page - 1
  const programs = await prisma.program.findMany({
    where: {
      isActive: true,
      isArchived: !!archived,
    },
    select: {
      id: true,
      name: true,
      deliveryMethod: true,
      createdAt: true,
      signersWalletAddresses: true,
      visibility: true,
      isArchived: true,
      userRoleProgramGroups: {
        select: {
          id: true,
          userRoleProgramGroupMembers: {
            select: {
              id: true,
              userRoleProgramId: true,
            },
            orderBy: {
              id: 'asc',
            },
          },
        },
        where: {
          role: 'APPROVER',
        },
        orderBy: {
          id: 'asc',
        },
      },
      programCurrency: {
        select: {
          currency: {
            select: {
              name: true,
            },
          },
          type: true,
        },
      },
      userRolePrograms: {
        select: {
          id: true,
          isActive: true,
          userRoleId: true,
          userRole: {
            select: {
              role: true,
              isActive: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
          groups: {
            select: {
              userRoleProgramGroupId: true,
            },
            orderBy: {
              userRoleProgramGroupId: 'asc',
            },
          },
        },
        where: {
          isActive: true,
        },
      },
    },
    skip: size * currentPage,
    take: Number(size),
  })

  const total = await prisma.program.count({
    where: {
      isActive: true,
      isArchived: !!archived,
    },
  })

  if (!programs) {
    return {
      error: {
        status: 404,
        errors: {
          programs: {
            message: `Programs ${errorsMessages.not_found}`,
          },
        },
      },
    }
  }

  const decrypted = await Promise.all(
    programs.map(async program => {
      const approversRole = await getProgramApprovers(program.userRolePrograms)
      const viewersRole = await getProgramViewers(program.userRolePrograms)
      return {
        id: program.id,
        program_name: program.name,
        delivery_method: program.deliveryMethod,
        created_at: program.createdAt,
        payment_unit_name: program.programCurrency.find(c => c.type === 'PAYMENT')?.currency.name,
        request_unit_name: program.programCurrency.find(c => c.type === 'REQUEST')?.currency.name,
        approversRole,
        viewersRole,
        signers_wallet_addresses: program.signersWalletAddresses,
        visibility: program.visibility,
        userRoleProgramGroupIds: program.userRoleProgramGroups.map(userRoleProgramGroup => userRoleProgramGroup.id),
        isArchived: program.isArchived,
      }
    })
  )

  return { data: { programs: decrypted, total } }
}

export async function findUserRolePrograms(userId: number) {
  const programs = await prisma.program.findMany({
    where: {
      isActive: true,
      userRolePrograms: {
        some: {
          userRole: {
            userId: userId,
          },
        },
      },
    },
    include: {
      programCurrency: {
        select: {
          currency: true,
          type: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  if (!programs) {
    return {
      error: {
        status: 404,
        errors: {
          programs: {
            message: `Programs ${errorsMessages.not_found}`,
          },
        },
      },
    }
  }

  return {
    data: programs,
  }
}

export async function findCompliancePrograms() {
  return await prisma.program.findMany({
    where: {
      isActive: true,
      transferRequests: {
        some: {
          status: 'BLOCKED',
        },
      },
    },
    include: {
      programCurrency: {
        select: {
          currency: true,
          type: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })
}

interface UserRoleProgramQueryResult {
  isActive: boolean
  id: number
  userRoleId: number
  userRole: {
    isActive: boolean
    role: Role
    user: {
      email: string
    }
  }
  groups: {
    userRoleProgramGroupId: number
  }[]
}

const getProgramApprovers = async (userRolePrograms: UserRoleProgramQueryResult[]) => {
  const activeApprovers = userRolePrograms.filter(urp => urp.userRole.isActive && urp.userRole.role === 'APPROVER')

  const dataDecrypted = await Promise.all(
    activeApprovers.map(async data => ({
      roleId: data.userRoleId,
      email: await decryptPII(data.userRole.user.email),
      groupIds: data.groups.map(userRoleProgramGroupMember => userRoleProgramGroupMember.userRoleProgramGroupId),
    }))
  )

  const groupedData = chain(dataDecrypted)
    .groupBy(approver => approver.groupIds)
    .map(value => value)
    .value()

  return groupedData
}

const getProgramViewers = async (userRolePrograms: UserRoleProgramQueryResult[]) => {
  const activeApprovers = userRolePrograms.filter(urp => urp.userRole.isActive && urp.userRole.role === 'VIEWER')

  const dataDecrypted = await Promise.all(
    activeApprovers.map(async data => ({
      roleId: data.userRoleId,
      email: await decryptPII(data.userRole.user.email),
    }))
  )

  return dataDecrypted
}

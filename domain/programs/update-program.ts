import { Prisma, ProgramVisibility, UserRoleProgram } from '@prisma/client'
import { groupProgramApproversRole } from 'components/SuperAdmin/Shared/utils'
import { submittedTransferRequestsBySuper } from 'domain/transfer-request-review/submitted-transfer-request'
import { TransactionError } from 'lib/errors'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { programAssociatedRequests } from './program-associated-requests'
import { updateProgramValidator } from './validation'

export interface UpdateProgramParams {
  superId: number
  approversRole: { roleId: number }[][]
  viewersRole: { roleId: number }[]
  id: number
  programCurrency: {
    name: string
    type: string
  }[]
  name: string
  visibility: ProgramVisibility
  updateApprovers: boolean
  updateViewers: boolean
  isArchived: boolean
}

type ProgramRole = Pick<UserRoleProgram, 'programId' | 'userRoleId'>

type PrevProgramRole = Pick<UserRoleProgram, 'id' | 'userRoleId' | 'isActive'>

export async function updateProgram(params: UpdateProgramParams) {
  const { superId } = params

  const { fields, errors } = await validate(updateProgramValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const {
    id,
    programCurrency,
    name,
    approversRole: approversRoleMatrix,
    viewersRole,
    visibility,
    updateApprovers = false,
    updateViewers = false,
    isArchived = false,
  } = fields

  const approversRole: ProgramRole[] = groupProgramApproversRole(approversRoleMatrix, id)

  return await newPrismaTransaction(async fnPrisma => {
    if (isArchived) {
      const count = await fnPrisma.program.count({
        where: {
          id,
          isActive: true,
          isArchived,
        },
      })

      if (count <= 0) {
        throw new TransactionError('Archived program not found', { status: 404, errors: undefined })
      }

      const userRolePrograms = await fnPrisma.userRoleProgram.findMany({
        where: { programId: id },
        select: {
          id: true,
          userRoleId: true,
          isActive: true,
          userRole: {
            select: {
              role: true,
            },
          },
        },
      })

      const prevViewersRole = userRolePrograms.filter(urp => urp.userRole.role === 'VIEWER')

      if (updateViewers) {
        const programRoles: ProgramRole[] =
          viewersRole?.map(vr => ({
            userRoleId: vr.roleId,
            programId: id,
          })) ?? []
        await deactiveProgramRoles({ fnPrisma, programId: id, programRoles: programRoles, prevProgramRoles: prevViewersRole })
        await setNewProgramRoles({ fnPrisma, programId: id, programRoles: programRoles, prevProgramRoles: prevViewersRole })
      }
      return count
    }

    const { count } = await fnPrisma.program.updateMany({
      where: {
        id,
        isActive: true,
        isArchived,
      },
      data: {
        name,
        visibility,
      },
    })

    if (count <= 0) {
      throw new TransactionError('Error updating program', { status: 404, errors: undefined })
    }

    const userRolePrograms = await fnPrisma.userRoleProgram.findMany({
      where: { programId: id },
      select: {
        id: true,
        userRoleId: true,
        isActive: true,
        userRole: {
          select: {
            role: true,
          },
        },
      },
    })

    const prevApproversRole = userRolePrograms.filter(urp => urp.userRole.role === 'APPROVER')
    const prevViewersRole = userRolePrograms.filter(urp => urp.userRole.role === 'VIEWER')

    if (updateApprovers) {
      await deactiveProgramRoles({ fnPrisma, programId: id, programRoles: approversRole, prevProgramRoles: prevApproversRole })
      await setNewProgramRoles({ fnPrisma, programId: id, programRoles: approversRole, prevProgramRoles: prevApproversRole })
      await updateUserRoleProgramGroupMembers({ fnPrisma, programId: id, approversRoleMatrix, superId })
    }

    if (updateViewers) {
      const programRoles: ProgramRole[] =
        viewersRole?.map(vr => ({
          userRoleId: vr.roleId,
          programId: id,
        })) ?? []
      await deactiveProgramRoles({ fnPrisma, programId: id, programRoles: programRoles, prevProgramRoles: prevViewersRole })
      await setNewProgramRoles({ fnPrisma, programId: id, programRoles: programRoles, prevProgramRoles: prevViewersRole })
    }

    const { data, error: associatedError } = await programAssociatedRequests({ programId: id })
    if (associatedError) {
      throw new TransactionError('Error updating program', { status: 500, errors: undefined })
    }
    // do not update the program currency if there are associated requests
    if (data.length > 0) {
      return count
    } else {
      await updateProgramCurrency({ fnPrisma, programId: id, programCurrency })

      return count
    }
  })
}

interface UpdateUserRoleProgramGroupMembersParams {
  fnPrisma: Prisma.TransactionClient
  programId: number
  approversRoleMatrix: { roleId: number }[][]
  superId: number
}

const updateUserRoleProgramGroupMembers = async ({
  fnPrisma,
  programId,
  approversRoleMatrix,
  superId,
}: UpdateUserRoleProgramGroupMembersParams) => {
  const userRoleProgramGroups = await fnPrisma.userRoleProgramGroup.findMany({
    where: {
      programId,
    },
    select: {
      id: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  if (userRoleProgramGroups.length) {
    const userRoleProgramGroupIds = userRoleProgramGroups.map(urpg => urpg.id)
    await fnPrisma.userRoleProgramGroupMembers.deleteMany({
      where: {
        userRoleProgramGroupId: {
          in: userRoleProgramGroupIds,
        },
      },
    })

    const approvedTransferRequest = await fnPrisma.transferRequestApprovals.findMany({
      where: {
        userRoleProgramGroupId: {
          in: userRoleProgramGroupIds,
        },
      },
      select: {
        transferRequestId: true,
      },
      distinct: ['transferRequestId'],
    })

    if (approvedTransferRequest.length) {
      await submittedTransferRequestsBySuper({
        transferRequestIds: approvedTransferRequest.map(request => request.transferRequestId),
        fnPrisma,
        superId,
      })
    }
  }

  const currentUserRolePrograms = await fnPrisma.userRoleProgram.findMany({
    where: { programId, isActive: true },
    select: { id: true, userRoleId: true },
  })

  approversRoleMatrix.forEach(async (group, idx) => {
    let groupId = userRoleProgramGroups[idx]?.id

    if (!groupId) {
      const result = await fnPrisma.userRoleProgramGroup.create({
        data: {
          programId,
          role: 'APPROVER',
        },
      })
      groupId = result.id
    }

    for (const role of group) {
      const userRoleProgram = currentUserRolePrograms.find(urp => urp.userRoleId === role.roleId)

      if (userRoleProgram) {
        await fnPrisma.userRoleProgramGroupMembers.create({
          data: {
            userRoleProgramGroupId: groupId,
            userRoleProgramId: userRoleProgram?.id,
          },
        })
      } else {
        throw new TransactionError('Error creating approvers group', { status: 500, errors: undefined })
      }
    }
  })
}

interface UpdateProgramRolesParams {
  fnPrisma: Prisma.TransactionClient
  programId: number
  programRoles: ProgramRole[]
  prevProgramRoles: PrevProgramRole[]
}

const deactiveProgramRoles = async ({ fnPrisma, programId, programRoles, prevProgramRoles }: UpdateProgramRolesParams) => {
  const deletedProgramRoles = prevProgramRoles.filter(
    prev => !programRoles.find(curr => curr.userRoleId === prev.userRoleId) && prev.isActive,
  )

  if (deletedProgramRoles.length > 0) {
    await Promise.all(
      deletedProgramRoles.map(async deletedApprover => {
        await fnPrisma.userRoleProgram.updateMany({
          where: {
            programId,
            id: deletedApprover.id,
          },
          data: {
            isActive: false,
          },
        })
      }),
    )
  }
}

const setNewProgramRoles = async ({ fnPrisma, programId, programRoles, prevProgramRoles }: UpdateProgramRolesParams) => {
  const rolesToCreate = []
  const rolesToUpdate = []

  for (const approver of programRoles) {
    const existingRole = prevProgramRoles.find(prev => prev.userRoleId === approver.userRoleId)
    !existingRole ? rolesToCreate.push(approver) : rolesToUpdate.push(existingRole)
  }

  await Promise.all(
    rolesToCreate.map(async role => {
      await fnPrisma.userRoleProgram.create({
        data: {
          programId: programId,
          userRoleId: role.userRoleId,
        },
      })
    }),
  )

  await Promise.all(
    rolesToUpdate.map(async role => {
      await fnPrisma.userRoleProgram.update({
        where: {
          id: role.id,
        },
        data: {
          isActive: true,
        },
      })
    }),
  )
}

interface UpdateProgramCurrencyParams {
  fnPrisma: Prisma.TransactionClient
  programId: number
  programCurrency: {
    name: string
    type: string
  }[]
}

const updateProgramCurrency = async ({ fnPrisma, programId, programCurrency }: UpdateProgramCurrencyParams) => {
  const [requestCurrencyUnit] = await fnPrisma.currencyUnit.findMany({
    where: {
      isActive: true,
      name: {
        equals: programCurrency.find(pc => pc.type === 'REQUEST')?.name,
      },
    },
    select: {
      id: true,
    },
  })

  await fnPrisma.programCurrency.updateMany({
    where: {
      programId,
      type: 'REQUEST',
      isActive: true,
    },
    data: {
      currencyUnitId: requestCurrencyUnit.id,
    },
  })

  const [paymentCurrencyUnit] = await fnPrisma.currencyUnit.findMany({
    where: {
      isActive: true,
      name: {
        equals: programCurrency.find(pc => pc.type === 'PAYMENT')?.name,
      },
    },
    select: {
      id: true,
    },
  })

  await fnPrisma.programCurrency.updateMany({
    where: {
      programId,
      type: 'PAYMENT',
      isActive: true,
    },
    data: {
      currencyUnitId: paymentCurrencyUnit.id,
    },
  })
}

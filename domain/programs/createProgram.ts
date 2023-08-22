import { DeliveryMethod, Prisma, ProgramVisibility } from '@prisma/client'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { TransactionError } from 'lib/errors'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { createProgramValidator } from './validation'

interface CreateProgramParams {
  name: string
  deliveryMethod: DeliveryMethod
  approversRole: { roleId: number }[][]
  viewersRole: { roleId: number }[]
  programCurrency: {
    name: string
    type: string
  }[]
  signersWalletAddresses?: { address: string }[]
  visibility: ProgramVisibility
}

export async function createProgram(params: CreateProgramParams) {
  const { fields, errors } = await validate(createProgramValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { name, deliveryMethod, approversRole, programCurrency, visibility, viewersRole } = fields

  return await newPrismaTransaction(async fnPrisma => {
    const [request, payment] = await Promise.all([
      fnPrisma.currencyUnit.findFirstOrThrow({
        where: { name: programCurrency.find(currency => currency.type === 'REQUEST')?.name },
      }),
      fnPrisma.currencyUnit.findFirstOrThrow({
        where: { name: programCurrency.find(currency => currency.type === 'PAYMENT')?.name },
      }),
    ])

    const createdProgram = await fnPrisma.program.create({
      data: {
        deliveryMethod,
        name,
        signersWalletAddresses: [],
        visibility,
        programCurrency: {
          create: [
            {
              currencyUnitId: request.id,
              type: 'REQUEST',
            },
            {
              currencyUnitId: payment.id,
              type: 'PAYMENT',
            },
          ],
        },
      },
    })

    if (!createdProgram) {
      throw new TransactionError('Error creating program', { status: 500, errors: undefined })
    }

    const userRoleIds = new Set<number>()
    const userRoleProgramMap = new Map<number, number>()
    const userRoleProgramGroupMembers: Prisma.UserRoleProgramGroupMembersUncheckedCreateInput[] = []

    for (const approversGroup of approversRole) {
      const userRoleProgramGroup = await fnPrisma.userRoleProgramGroup.create({
        data: {
          role: APPROVER_ROLE,
          programId: createdProgram.id,
        },
      })

      for (const approver of approversGroup) {
        const userRoleId = approver.roleId

        if (!userRoleIds.has(userRoleId)) {
          const createdUserRoleProgram = await fnPrisma.userRoleProgram.create({
            data: {
              userRoleId,
              programId: createdProgram.id,
            },
          })
          userRoleProgramMap.set(userRoleId, createdUserRoleProgram.id)
          userRoleIds.add(userRoleId)
        }

        userRoleProgramGroupMembers.push({
          userRoleProgramGroupId: userRoleProgramGroup.id,
          userRoleProgramId: userRoleProgramMap.get(approver.roleId)!,
        })
      }
    }

    if (viewersRole?.length) {
      await fnPrisma.userRoleProgram.createMany({
        data: viewersRole.map(viewerRole => ({
          programId: createdProgram.id,
          userRoleId: viewerRole.roleId,
        })),
      })
    }

    await fnPrisma.userRoleProgramGroupMembers.createMany({
      data: userRoleProgramGroupMembers,
    })

    return createdProgram
  })
}

import { DeliveryMethod, Prisma, ProgramVisibility } from '@prisma/client'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { TransactionError } from 'lib/errors'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { createProgramValidator } from './validation'
import prisma from 'lib/prisma'
import { AppConfig } from 'config/system'
import { ERC20Token, NativeToken } from 'config/chains'
import { USD } from 'domain/currency/constants'
import { REQUEST_TOKEN } from './constants'

interface CreateProgramParams {
  name: string
  deliveryMethod: DeliveryMethod
  approversRole: { roleId: number }[][]
  viewersRole: { roleId: number }[]
  programCurrency: {
    name: string
    type: string
    blockchain: string
  }[]
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

  const { name, deliveryMethod, approversRole, visibility, viewersRole, paymentToken, requestType } = fields

  const trimmedName = name.trim()

  const existingProgram = await prisma.program.findFirst({
    where: { name: trimmedName },
  })

  if (existingProgram) {
    return {
      error: {
        status: 400,
        errors: {
          name: 'Program name already exists',
          type: 'internal',
        },
      },
    }
  }

  const paymentTokenObject = AppConfig.network.getTokenByIdentifier(paymentToken) as NativeToken | ERC20Token
  const paymentTokenBlockchain = AppConfig.network.getChainByToken(paymentTokenObject)
  const paymentBlockchain = await prisma.blockchain.findFirst({
    where: { name: paymentTokenBlockchain?.name },
  })
  const paymentCurrency = await prisma.currencyUnit.findFirstOrThrow({
    where: { name: paymentTokenObject?.symbol, currency: { blockchainId: paymentBlockchain?.id } },
    select: { currency: true, id: true },
  })

  const requestCurrencyUnit =
    requestType === REQUEST_TOKEN
      ? paymentCurrency
      : await prisma.currencyUnit.findFirstOrThrow({
          where: { name: USD, currency: { blockchainId: null } },
        })

  return await newPrismaTransaction(async fnPrisma => {
    const createdProgram = await fnPrisma.program.create({
      data: {
        deliveryMethod,
        name: trimmedName,
        visibility,
        currencyId: paymentCurrency.currency.id,
        programCurrency: {
          create: [
            {
              currencyUnitId: requestCurrencyUnit.id,
              type: 'REQUEST',
            },
            {
              currencyUnitId: paymentCurrency.id,
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

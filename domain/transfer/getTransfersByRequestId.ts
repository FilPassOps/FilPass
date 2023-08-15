import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { getTransfersByRequestIdValidator } from './validation'

interface GetTransfersByRequestIdParams {
  requests: string[]
}

export async function getTransfersByRequestId(params: GetTransfersByRequestIdParams) {
  const { fields, errors } = await validate(getTransfersByRequestIdValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { requests } = fields

  const transfers = await prisma.transfer.findMany({
    where: {
      isActive: true,
      transferRequest: {
        isActive: true,
        publicId: {
          in: requests,
        },
      },
    },
    select: {
      id: true,
      status: true,
      transferRef: true,
      updatedAt: true,
      transferRequest: {
        select: {
          publicId: true,
        },
      },
    },
  })

  return { data: transfers }
}

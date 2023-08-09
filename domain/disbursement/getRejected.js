import { REJECTED_BY_CONTROLLER_STATUS } from 'domain/transferRequest/constants'
import prisma from 'lib/prisma'

export const getRejected = async params => {
  const { programId, requestNumber, teamHashes, size = 100, page = 1, sort = 'createdAt', order = 'asc', from, to, wallets } = params || {}
  const currentPage = page - 1 < 0 ? 0 : page - 1

  const total = await prisma.transferRequest.count({
    where: {
      isActive: true,
      status: REJECTED_BY_CONTROLLER_STATUS,
      programId: programId?.length ? { in: programId } : undefined,
      publicId: params.requestNumber,
      teamHash: teamHashes ? { in: teamHashes } : undefined,
      createdAt:
        from && to
          ? {
              gte: from,
              lte: to,
            }
          : undefined,
      wallet: wallets?.length ? { in: wallets } : undefined,
    },
  })

  const requests = await prisma.transferRequest.findMany({
    where: {
      isActive: true,
      status: REJECTED_BY_CONTROLLER_STATUS,
      programId: programId?.length ? { in: programId } : undefined,
      publicId: requestNumber,
      teamHash: teamHashes ? { in: teamHashes } : undefined,
      createdAt:
        from && to
          ? {
              gte: from,
              lte: to,
            }
          : undefined,
      wallet: { address: wallets?.length ? { in: wallets } : undefined },
    },
    select: {
      id: true,
      publicId: true,
      team: true,
      createdAt: true,
      updatedAt: true,
      amount: true,
      status: true,
      vestingStartEpoch: true,
      vestingMonths: true,
      wallet: {
        select: {
          address: true,
          blockchain: true,
          verificationId: true,
        },
      },
      program: {
        select: {
          name: true,
          deliveryMethod: true,
          programCurrency: {
            select: {
              type: true,
              currency: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      currency: {
        select: {
          name: true,
        },
      },
    },
    take: size,
    skip: size * currentPage,
    orderBy: {
      [sort]: getOrderValue(sort, order),
    },
  })

  return { data: { requests, total } }
}

const getOrderValue = (sort, order) => {
  if (sort === 'program') {
    return { name: order }
  }

  return order
}

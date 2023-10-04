import prisma from 'lib/prisma'
import { PENDING_STATUS } from './constants'

export const cancelTransfers = async (requestIds: number[], controllerUserRoleId: number, reason?: string) => {
  const transferRequest = await prisma.transferRequest.findMany({
    where: {
      id: {
        in: requestIds,
      },
      transfers: {
        some: {
          status: PENDING_STATUS,
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      transfers: {
        select: {
          id: true,
          status: true,
        },
        where: {
          txHash: null,
          isActive: true,
          status: PENDING_STATUS,
        },
      },
    },
  })

  if (transferRequest.length !== requestIds.length) {
    throw new Error('Invalid request ids')
  }

  if (transferRequest.some(req => req.transfers.length < 1)) {
    throw new Error('Some requests do not have transfers')
  }

  await prisma.transfer.updateMany({
    where: {
      transferRequestId: {
        in: transferRequest.map(req => req.id),
      },
      status: PENDING_STATUS,
      controllerId: controllerUserRoleId,
      isActive: true,
      transferRef: {
        not: {
          startsWith: 'PLREF',
        },
      },
    },
    data: {
      status: reason ? 'FAILED' : undefined,
      isActive: false,
      notes: reason,
    },
  })
}

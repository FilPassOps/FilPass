import prisma from 'lib/prisma'

export const cancelTransfers = async (requestIds: number[], controllerUserRoleId: number, reason?: string) => {
  const transferRequest = await prisma.transferRequest.findMany({
    where: {
      id: {
        in: requestIds,
      },
      transfers: {
        some: {
          status: 'PENDING',
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
          status: 'PENDING',
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
      status: 'PENDING',
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

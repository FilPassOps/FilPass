import crypto from 'crypto'
import prisma from 'lib/prisma'

interface PrepareTransferProps {
  requests: number[]
  from: string
  to: string
  controllerUserRoleId: number
}

export const prepareTransfers = async ({ requests, from, to, controllerUserRoleId }: PrepareTransferProps) => {
  const transferRequest = await prisma.transferRequest.findMany({
    where: {
      id: {
        in: requests,
      },
    },
    select: {
      id: true,
      publicId: true,
      transfers: {
        select: {
          id: true,
          txHash: true,
          status: true,
        },
        where: {
          isActive: true,
        },
      },
    },
  })

  if (transferRequest.length !== requests.length) {
    throw new Error('Invalid request ids')
  }
  if (transferRequest.some(req => req.transfers.find(transfer => transfer.status === 'SUCCESS'))) {
    throw new Error('Some requests were already paid')
  }

  if (transferRequest.some(req => req.transfers.find(transfer => !!transfer.txHash))) {
    throw new Error('Some requests already have transfers')
  }

  const pendingTransferRequests = transferRequest.reduce((acc, trReq) => {
    if (trReq.transfers.some(tr => !tr.txHash)) {
      acc.push(trReq.publicId)
    }
    return acc
  }, Array<string>())

  const uuid = crypto.randomUUID()

  await prisma.transfer.createMany({
    data: transferRequest.map(request => ({
      controllerId: controllerUserRoleId,
      transferRequestId: request.id,
      transferRef: uuid,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
    })),
  })

  return { uuid, pendingTransferRequests }
}

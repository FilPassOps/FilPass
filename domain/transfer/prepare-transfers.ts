import crypto from 'crypto'
import prisma from 'lib/prisma'
import { SUCCESS_STATUS } from './constants'
import { encrypt } from 'lib/emissary-crypto'

interface RequestsData {
  [key: string]: {
    id: number
    amount: string
  }
}

interface PrepareTransferProps {
  requests: RequestsData
  from: string
  to: string
  controllerUserRoleId: number
}

export const prepareTransfers = async ({ requests, from, to, controllerUserRoleId }: PrepareTransferProps) => {
  const requestsIds = Object.keys(requests).map(Number)

  const transferRequest = await prisma.transferRequest.findMany({
    where: {
      id: {
        in: requestsIds,
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

  if (transferRequest.length !== requestsIds.length) {
    throw new Error('Invalid request ids')
  }
  if (transferRequest.some(req => req.transfers.find(transfer => transfer.status === SUCCESS_STATUS))) {
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

  const newTransferData = transferRequest.map(async request => ({
    controllerId: controllerUserRoleId,
    transferRequestId: request.id,
    transferRef: uuid,
    from: from.toLowerCase(),
    to: to.toLowerCase(),
    amount: (await encrypt(requests[request.id]?.amount)) as string,
  }))

  await Promise.all(newTransferData).then(async newTransferData => {
    await prisma.transfer.createMany({
      data: newTransferData,
    })
  })

  return { uuid, pendingTransferRequests }
}

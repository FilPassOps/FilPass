import prisma from 'lib/prisma'

interface TransfersPaymentSentProps {
  requests: number[]
  controllerUserRoleId: number
  hash: string
  from: string
  to: string
}

export const transfersPaymentSent = async ({ requests, controllerUserRoleId, hash, from, to }: TransfersPaymentSentProps) => {
  const transferRequest = await prisma.transferRequest.findMany({
    where: {
      id: {
        in: requests,
      },
    },
    select: {
      id: true,
      transfers: {
        select: {
          id: true,
        },
        where: {
          txHash: null,
          isActive: true,
        },
      },
    },
  })

  if (transferRequest.length !== requests.length) {
    throw new Error('Invalid request ids')
  }

  if (transferRequest.some(req => req.transfers.length < 1)) {
    throw new Error('Some requests do not have transfers')
  }

  await prisma.transfer.updateMany({
    where: {
      transferRequestId: {
        in: requests,
      },
      controllerId: controllerUserRoleId,
      isActive: true,
    },
    data: {
      txHash: hash,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
    },
  })
}

import { TransferRequestStatus } from '@prisma/client'
import prisma from 'lib/prisma'

interface Params {
  status: TransferRequestStatus
  networks: string[]
}

export async function getCountByNetworkAndStatus({ networks, status }: Params) {
  let transfers = {}
  if (status === 'APPROVED') {
    transfers = {
      none: {
        status: 'PENDING',
        txHash: { not: null },
        isActive: true,
      },
    }
  }
  const promises = []
  for (const network of networks) {
    promises.push(
      prisma.transferRequest.count({
        where: {
          isActive: true,
          status: status,
          program: {
            currency: {
              blockchain: {
                name: network,
              },
            },
          },
          transfers,
        },
      }),
    )
  }

  const results = await Promise.all(promises)

  const data: Record<string, number> = networks.reduce(
    (acc, network, index) => {
      acc[network] = results[index]
      return acc
    },
    {} as Record<string, number>,
  )

  return data
}

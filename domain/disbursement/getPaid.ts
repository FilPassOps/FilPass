import { SUCCESS_STATUS } from 'domain/transfer/constants'
import { PAID_STATUS } from 'domain/transferRequest/constants'
import { decrypt, decryptPII } from 'lib/emissaryCrypto'
import prisma from 'lib/prisma'

interface GetPaidParams {
  programId?: number[]
  requestNumber?: string
  teamHashes?: string[]
  size?: number
  page?: number
  sort?: string
  order?: string
  from?: Date
  to?: Date
  wallets?: string[]
}

export const getPaid = async (params: GetPaidParams) => {
  const { programId, requestNumber, teamHashes, size = 100, page = 1, sort = 'createdAt', order = 'asc', from, to, wallets } = params || {}

  const currentPage = page - 1 < 0 ? 0 : page - 1

  const total = await prisma.transferRequest.count({
    where: {
      isActive: true,
      status: PAID_STATUS,
      programId: programId?.length ? { in: programId } : undefined,
      publicId: params.requestNumber,
      teamHash: teamHashes ? { in: teamHashes } : undefined,
      updatedAt:
        from && to
          ? {
              gte: from,
              lte: to,
            }
          : undefined,
      wallet: { address: wallets?.length ? { in: wallets } : undefined },
    },
  })

  const requests = await prisma.transferRequest.findMany({
    where: {
      isActive: true,
      status: PAID_STATUS,
      programId: programId?.length ? { in: programId } : undefined,
      publicId: requestNumber,
      teamHash: teamHashes ? { in: teamHashes } : undefined,
      updatedAt:
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
      isUSResident: true,
      form: {
        select: {
          publicId: true,
        },
      },
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
      receiver: {
        select: {
          email: true,
        },
      },
      transfers: {
        where: { status: SUCCESS_STATUS },
        select: {
          amount: true,
          txHash: true,
          status: true,
          amountCurrencyUnit: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    take: size,
    skip: size * currentPage,
    orderBy: {
      [sort]: getOrderValue(sort, order),
    },
  })

  const decrypted = await Promise.all(
    requests.map(async req => {
      return {
        ...req,
        receiver: {
          ...req.receiver,
          email: await decryptPII(req.receiver.email),
        },
        transfers: await Promise.all(
          req.transfers.map(async transfer => ({ ...transfer, amount: transfer.amount ? await decrypt(transfer.amount) : null })),
        ),
      }
    }),
  )

  return { data: { requests: decrypted, total } }
}

const getOrderValue = (sort: string, order: string) => {
  if (sort === 'program') {
    return { name: order }
  }

  return order
}

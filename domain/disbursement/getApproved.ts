import { Currency, Program, ProgramCurrency, TransferRequest, UserWallet } from '@prisma/client'
import { Transfer } from 'aws-sdk'
import { APPROVED } from 'domain/transferRequestReview/constants'
import prisma from 'lib/prisma'
export interface GetApprovedParams {
  programId?: number[]
  requestNumber?: string
  teamHashes?: string[]
  from?: Date
  to?: Date
  wallets?: string[]
  size?: number
  page?: number
  sort?: string
  order?: string
}

export interface DisbursementRequests extends TransferRequest {
  wallet: UserWallet
  program: Program & {
    programCurrency: ProgramCurrency & {
      currency: Currency
    }
  }
  currency: Currency
  transfer: Transfer[] & {
    amountCurrencyUnit: Currency
  }
}

export interface GetApprovedResponse {
  data: {
    requests: DisbursementRequests[]
    total: number
  }
}

export const getApproved = async (params: GetApprovedParams): Promise<GetApprovedResponse> => {
  const { programId, teamHashes, size = 100, page = 1, sort = 'createdAt', order = 'asc', requestNumber, from, to, wallets } = params || {}
  const currentPage = page - 1 < 0 ? 0 : page - 1

  const total = await prisma.transferRequest.count({
    where: {
      isActive: true,
      status: APPROVED,
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
      transfers: {
        none: {
          status: 'PENDING',
          txHash: { not: null },
          isActive: true,
        },
      },
    },
  })

  const requests: any[] = await prisma.transferRequest.findMany({
    where: {
      isActive: true,
      status: APPROVED,
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
      transfers: {
        none: {
          status: 'PENDING',
          isActive: true,
          txHash: { not: null },
        },
      },
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
      transfers: {
        select: {
          amount: true,
          txHash: true,
          status: true,
          isActive: true,
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

  return { data: { requests, total } }
}

const getOrderValue = (sort: string, order: string) => {
  if (sort === 'program') {
    return { name: order }
  }

  return order
}

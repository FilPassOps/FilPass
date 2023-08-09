import { Prisma } from '@prisma/client'
import prisma from 'lib/prisma'
import { PROCESSING_STATUS, SUBMITTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from './constants'

export async function findSubmittedByPublicId<S extends Prisma.TransferRequestSelect>(
  publicIds: string[],
  select: Prisma.Subset<S, Prisma.TransferRequestSelect>
) {
  return await prisma.transferRequest.findMany({
    select: select,
    where: {
      publicId: {
        in: publicIds,
      },
      status: { in: [SUBMITTED_STATUS, SUBMITTED_BY_APPROVER_STATUS, PROCESSING_STATUS] },
      isActive: true,
    },
  })
}

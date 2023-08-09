import { PrismaClient } from '@prisma/client'
import { getPrismaClient } from 'lib/prisma'

export async function findUserTaxForm(userId: number) {
  const prisma: PrismaClient = await getPrismaClient()

  return await prisma.userFile.findFirst({
    select: {
      id: true,
      publicId: true,
      filename: true,
      type: true,
      isApproved: true,
      rejectionReason: true,
    },
    where: {
      userId: userId,
      isActive: true,
      type: {
        in: ['W8_FORM', 'W9_FORM'],
      },
    },
  })
}

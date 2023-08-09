import { PrismaClient } from '@prisma/client'
import { decryptPII } from 'lib/emissaryCrypto'
import { getPrismaClient } from 'lib/prisma'

export async function findAllApprovers() {
  const prisma: PrismaClient = await getPrismaClient()

  const approvers = await prisma.userRole.findMany({
    where: {
      role: 'APPROVER',
      isActive: true,
    },
    select: {
      id: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  })

  const dataDecrypted = await Promise.all(
    approvers.map(async data => ({
      roleId: data.id,
      email: await decryptPII(data.user.email),
    }))
  )

  return { data: dataDecrypted }
}

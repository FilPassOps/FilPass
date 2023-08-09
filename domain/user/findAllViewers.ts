import { PrismaClient } from '@prisma/client'
import { decryptPII } from 'lib/emissaryCrypto'
import { getPrismaClient } from 'lib/prisma'

export async function findAllViewers() {
  const prisma: PrismaClient = await getPrismaClient()

  const viewers = await prisma.userRole.findMany({
    where: {
      role: 'VIEWER',
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
    viewers.map(async data => ({
      roleId: data.id,
      email: await decryptPII(data.user.email),
    }))
  )

  return { data: dataDecrypted }
}

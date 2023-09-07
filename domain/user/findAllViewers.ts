import { decryptPII } from 'lib/emissaryCrypto'
import prisma from 'lib/prisma'

export async function findAllViewers() {
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

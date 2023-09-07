import { decryptPII } from 'lib/emissaryCrypto'
import prisma from 'lib/prisma'

export async function findAllApprovers() {
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

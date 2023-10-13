import { APPROVER_ROLE } from 'domain/auth/constants'
import { decryptPII } from 'lib/emissary-crypto'
import prisma from 'lib/prisma'

export async function getAllApprovers() {
  const approvers = await prisma.userRole.findMany({
    where: {
      role: APPROVER_ROLE,
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
    })),
  )

  return { data: dataDecrypted }
}

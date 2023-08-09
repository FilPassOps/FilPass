import prisma from 'lib/prisma'

export async function isUserSanctioned(userId: number) {
  const result = await prisma.user.findUnique({
    select: {
      isSanctioned: true,
      sanctionReason: true,
    },
    where: {
      id: userId,
    },
  })

  if (result !== null) {
    return {
      ...result,
      isSanctioned: result.isSanctioned ?? true,
    }
  }

  return result
}

import prisma from 'lib/prisma'

export async function isUserBanned(userId: number) {
  const result = await prisma.user.findUnique({
    select: {
      isBanned: true,
    },
    where: {
      id: userId,
    },
  })

  if (!result) {
    throw new Error('User not found')
  }

  return result.isBanned
}

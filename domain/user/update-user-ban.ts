import prisma from 'lib/prisma'

interface updateUserBanRequestParams {
  id: number
  isBanned: boolean
  banReason?: string
  superAdminUserRoleId: number
}

export async function updateUserBan(params: updateUserBanRequestParams) {
  const { id, isBanned, banReason, superAdminUserRoleId } = params

  return prisma.user.update({
    where: {
      id,
      isActive: true,
    },
    data: {
      isBanned,
      banReason,
      banActionedById: superAdminUserRoleId,
    },
  })
}

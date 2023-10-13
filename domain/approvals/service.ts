import { Role } from '@prisma/client'
import { APPROVER_ROLE, VIEWER_ROLE } from 'domain/auth/constants'
import { getUserRolePrograms } from 'domain/programs/get-all'
import { PAID_STATUS, SUBMITTED_STATUS } from 'domain/transfer-request/constants'
import { getApproverTransferRequestById } from 'domain/transfer-request/get-approver-transfer-request-by-id'
import { getApproverTransferRequests } from 'domain/transfer-request/get-approver-transfer-requests'
import { getViewerTransferRequestById } from 'domain/transfer-request/get-viewer-transfer-request-by-id'
import { getViewerTransferRequests } from 'domain/transfer-request/get-viewer-transfer-requests'
import { generateTeamHash } from 'lib/password'
import prisma from 'lib/prisma'

export type GetApproverSort = 'number' | 'program' | 'create_date' | 'status'
export type GetApproverOrder = 'asc' | 'desc'

interface GetApprovalsByRoleParams {
  roles: { id: number; role: Role }[]
  userId: number
  status?: string
  programId?: string
  networks?: string[]
  requestNumber?: string
  team?: string[]
  from?: Date
  to?: Date
  wallets?: string[]
  size?: number
  sort?: 'number' | 'program' | 'create_date'
  order?: 'asc' | 'desc'
  page?: number
}

interface GetApprovalDetailsByRoleParams {
  transferRequestId: string
  userId: number
  roles: { id: number; role: Role }[]
}

export const getApprovalDetailsByRole = async ({ transferRequestId, userId, roles }: GetApprovalDetailsByRoleParams) => {
  const transferRequest = await prisma.transferRequest.findUnique({
    where: { publicId: transferRequestId },
    select: {
      status: true,
    },
  })
  if (roles.some(roleObject => roleObject.role === VIEWER_ROLE) && transferRequest?.status === 'PAID') {
    return getViewerTransferRequestById({
      transferRequestId,
      userId,
      status: transferRequest.status,
    })
  } else {
    return getApproverTransferRequestById({
      transferRequestId,
      userId,
    })
  }
}

export const getApprovalsByRole = async ({
  roles,
  userId,
  status,
  programId,
  networks,
  requestNumber,
  team,
  from,
  to,
  wallets,
  size,
  sort,
  order,
  page,
}: GetApprovalsByRoleParams) => {
  const programIds =
    programId
      ?.toString()
      .split(',')
      .map(id => parseInt(id)) ?? undefined

  const teamHashes = team ? await Promise.all(team.map(team => generateTeamHash(team))) : undefined
  const isApprover = roles.some(({ role }) => role === APPROVER_ROLE)
  const isViewer = roles.some(({ role }) => role === VIEWER_ROLE)
  let currentStatus = status

  if (isApprover && !status) {
    currentStatus = SUBMITTED_STATUS
  }

  if (isViewer && !isApprover && !status && !currentStatus) {
    currentStatus = PAID_STATUS
  }

  if (currentStatus === PAID_STATUS && isViewer) {
    const result = await getViewerTransferRequests({
      viewerId: userId,
      programId: programIds,
      networks,
      requestNumber,
      teamHashes,
      from,
      to,
      wallets,
      size,
      sort,
      order,
      page,
    })

    const { data: programs } = await getUserRolePrograms(userId)

    return {
      transfers: result.data?.transfers,
      totalItems: result.data?.totalItems,
      error: result.error,
      shouldShowHeaderCheckbox: false,
      currentStatus,
      programs,
    }
  }

  const result = await getApproverTransferRequests({
    approverId: userId,
    status: currentStatus,
    programId: programIds,
    networks,
    requestNumber,
    teamHashes,
    from,
    to,
    wallets,
    size,
    sort,
    order,
    page,
  })

  const { data: programs } = await getUserRolePrograms(userId)
  return {
    transfers: result.data?.transfers,
    totalItems: result.data?.totalItems,
    error: result.error,
    shouldShowHeaderCheckbox: currentStatus === SUBMITTED_STATUS,
    currentStatus,
    programs,
  }
}

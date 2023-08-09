import { UserRole } from '@prisma/client'
import { APPROVER_ROLE, COMPLIANCE_ROLE, VIEWER_ROLE } from 'domain/auth/constants'
import { findCompliancePrograms, findUserRolePrograms } from 'domain/programs/findAll'
import { BLOCKED_STATUS, PAID_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { getApproverTransferRequestById } from 'domain/transferRequest/getApproverTransferRequestById'
import { getApproverTransferRequests } from 'domain/transferRequest/getApproverTransferRequests'
import { getComplianceTransferRequests } from 'domain/transferRequest/getComplianceTransferRequest'
import { getComplianceTransferRequestById } from 'domain/transferRequest/getComplianceTransferRequestById'
import { getViewerTransferRequestById } from 'domain/transferRequest/getViewerTransferRequestById'
import { getViewerTransferRequests } from 'domain/transferRequest/getViewerTransferRequests'
import { generateTeamHash } from 'lib/password'
import prisma from 'lib/prisma'

interface GetApprovalsByRoleParams {
  roles: UserRole[]
  userId: number
  status?: string
  programId?: string
  requestNumber?: string
  team?: string[]
  from?: Date
  to?: Date
  wallets?: string[]
  size: number
  sort?: 'number' | 'program' | 'create_date'
  order?: 'asc' | 'desc'
  page?: number
}

interface GetApprovalDetailsByRoleParams {
  transferRequestId: string
  userId: number
  roles: UserRole[]
}

export const getApprovalDetailsByRole = async ({ transferRequestId, userId, roles }: GetApprovalDetailsByRoleParams) => {
  const transferRequest = await prisma.transferRequest.findUnique({
    where: { publicId: transferRequestId },
    select: {
      status: true,
    },
  })
  const isCompliance = roles.some(roleObject => roleObject.role === COMPLIANCE_ROLE)
  if (isCompliance && transferRequest?.status === 'BLOCKED') {
    return getComplianceTransferRequestById({
      transferRequestId,
      status: transferRequest.status,
    })
  } else if (roles.some(roleObject => roleObject.role === VIEWER_ROLE) && transferRequest?.status === 'PAID') {
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
  const isCompliance = roles.some(({ role }) => role === COMPLIANCE_ROLE)
  let currentStatus = status

  if (isApprover && !status) {
    currentStatus = SUBMITTED_STATUS
  }

  if (roles.some(({ role }) => role === COMPLIANCE_ROLE) && !isApprover && !status && !currentStatus) {
    currentStatus = BLOCKED_STATUS
  }

  if (isViewer && !isApprover && !status && !currentStatus) {
    currentStatus = PAID_STATUS
  }

  if (currentStatus === BLOCKED_STATUS && isCompliance) {
    const result = await getComplianceTransferRequests({
      programId: programIds,
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

    const programs = await findCompliancePrograms()

    return {
      transfers: result.data?.transfers,
      totalItems: result.data?.totalItems,
      error: result.error,
      shouldShowHeaderCheckbox: false,
      currentStatus,
      programs,
    }
  }

  if (currentStatus === PAID_STATUS && isViewer) {
    const result = await getViewerTransferRequests({
      viewerId: userId,
      programId: programIds,
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

    const { data: programs } = await findUserRolePrograms(userId)

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

  const { data: programs } = await findUserRolePrograms(userId)
  return {
    transfers: result.data?.transfers,
    totalItems: result.data?.totalItems,
    error: result.error,
    shouldShowHeaderCheckbox: currentStatus === SUBMITTED_STATUS,
    currentStatus,
    programs,
  }
}

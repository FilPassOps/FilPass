import { PrismaClient } from '@prisma/client'
import { SYSTEM_USER_ROLE_ID } from 'domain/auth/constants'
import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import { BLOCKED_STATUS, PROCESSING_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { encryptPII } from 'lib/emissaryCrypto'
import { getPrismaClient, newPrismaTransaction } from 'lib/prisma'
import { findUserTaxForm } from './findUserTaxForms'

interface UpdateUserOnHoldTranferRequestsParams {
  userId: number
  isSanctioned: boolean
  sanctionReason: string | null
}

export async function updateUserOnHoldTranferRequests({ userId, isSanctioned, sanctionReason }: UpdateUserOnHoldTranferRequestsParams) {
  const prisma: PrismaClient = await getPrismaClient()
  const taxForm = await findUserTaxForm(userId)
  const newSanctionReason = sanctionReason ? await encryptPII(sanctionReason) : null

  const transferRequests = await prisma.transferRequest.findMany({
    include: {
      receiver: true,
    },
    where: {
      status: isSanctioned ? { in: [SUBMITTED_STATUS, REQUIRES_CHANGES_STATUS, PROCESSING_STATUS] } : 'BLOCKED', //BLOCKED and ON_HOLD mean the same
      receiverId: userId,
      isActive: true,
    },
  })

  let updatedRequests = 0
  for (const transferRequest of transferRequests) {
    const newStatus = !isSanctioned && (taxForm?.isApproved || transferRequest.isLegacy) ? SUBMITTED_STATUS : BLOCKED_STATUS
    await newPrismaTransaction(async fnPrisma => {
      await fnPrisma.transferRequest.update({
        where: {
          id: transferRequest.id,
        },
        data: {
          status: newStatus,
          isSanctioned,
          sanctionReason: newSanctionReason,
        },
      })

      const newTransferRequestValue = {
        ...transferRequest,
        status: newStatus,
        isSanctioned,
        sanctionReason: newSanctionReason,
      }

      await createRequestChangeHistory(fnPrisma, {
        newValue: newTransferRequestValue,
        oldValue: transferRequest,
        transferRequestId: transferRequest.id,
        userRoleId: SYSTEM_USER_ROLE_ID,
      })
      updatedRequests++
    })
  }
  return updatedRequests
}

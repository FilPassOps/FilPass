import { SYSTEM_USER_ROLE_ID } from 'domain/auth/constants'
import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import { BLOCKED_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import { findUserTaxForm } from './findUserTaxForms'

interface UpdateUserOnHoldTranferRequestsParams {
  userId: number
}

export async function updateUserOnHoldTranferRequests({ userId }: UpdateUserOnHoldTranferRequestsParams) {
  const taxForm = await findUserTaxForm(userId)

  const transferRequests = await prisma.transferRequest.findMany({
    include: {
      receiver: true,
    },
    where: {
      status: BLOCKED_STATUS, //BLOCKED and ON_HOLD mean the same
      receiverId: userId,
      isActive: true,
    },
  })

  let updatedRequests = 0
  for (const transferRequest of transferRequests) {
    const newStatus = taxForm?.isApproved || transferRequest.isLegacy ? SUBMITTED_STATUS : BLOCKED_STATUS
    await newPrismaTransaction(async fnPrisma => {
      await fnPrisma.transferRequest.update({
        where: {
          id: transferRequest.id,
        },
        data: {
          status: newStatus,
        },
      })

      const newTransferRequestValue = {
        ...transferRequest,
        status: newStatus,
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

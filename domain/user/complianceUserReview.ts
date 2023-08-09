import { TransferRequestStatus } from '@prisma/client'
import { sendPIIRejectedNotification } from 'domain/notifications/sendPIIRejectedNotification'
import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import {
  BLOCKED_STATUS,
  PROCESSING_STATUS,
  REJECTED_BY_COMPLIANCE_STATUS,
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_STATUS,
} from 'domain/transferRequest/constants'
import { userComplianceReviewValidator } from 'domain/transferRequestReview/validation'
import { encryptPII } from 'lib/emissaryCrypto'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { findUserTaxForm } from './findUserTaxForms'

interface UserComplianceReviewParams {
  id: number
  complianceUserRoleId: number
  isSanctioned: boolean
}

export async function userComplianceReview(params: UserComplianceReviewParams) {
  const { fields, errors } = await validate(userComplianceReviewValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { id, complianceUserRoleId, isSanctioned } = fields

  const flaggedUser = await prisma.user.findFirst({
    where: {
      id,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      sanctionReason: true,
    },
  })

  if (!flaggedUser) {
    return {
      error: {
        status: 404,
        message: errorsMessages.not_found.message,
      },
    }
  }

  const taxForm = await findUserTaxForm(id)

  const transferRequests = await prisma.transferRequest.findMany({
    where: {
      receiverId: flaggedUser.id,
      status: isSanctioned
        ? {
            in: [
              BLOCKED_STATUS, // ON_HOLD ia an alias for BLOCKED
              SUBMITTED_STATUS,
              REQUIRES_CHANGES_STATUS,
              PROCESSING_STATUS,
            ],
          }
        : BLOCKED_STATUS,
      isActive: true,
    },
  })

  const { data, error } = await newPrismaTransaction(async fnPrisma => {
    const sanctionReason = isSanctioned && flaggedUser.sanctionReason ? await encryptPII(flaggedUser.sanctionReason) : null

    await fnPrisma.user.update({
      where: {
        id: flaggedUser.id,
      },
      data: {
        isReviewedByCompliance: true,
        isSanctioned,
      },
    })

    for (const transferRequest of transferRequests) {
      let newStatus: TransferRequestStatus | undefined = undefined

      if (isSanctioned) {
        newStatus = REJECTED_BY_COMPLIANCE_STATUS
      } else if (!isSanctioned && (transferRequest.isLegacy || taxForm?.isApproved)) {
        newStatus = SUBMITTED_STATUS
      }

      await fnPrisma.transferRequest.update({
        where: {
          id: transferRequest.id,
        },
        data: {
          status: newStatus,
          isSanctioned,
          sanctionReason,
        },
      })

      const newTransferRequestValue = {
        ...transferRequest,
        ...(newStatus && { status: newStatus }),
      }

      await createRequestChangeHistory(fnPrisma, {
        newValue: newTransferRequestValue,
        oldValue: transferRequest,
        transferRequestId: transferRequest.id,
        userRoleId: complianceUserRoleId,
      })
    }
  })

  if (error) {
    return {
      error: {
        status: error.status,
        message: isSanctioned ? errorsMessages.error_blocking_user.message : errorsMessages.error_unblocking_user.message,
      },
    }
  }

  if (isSanctioned) {
    await sendPIIRejectedNotification({ email: flaggedUser.email })
  }

  return {
    data,
  }
}

import { FileType } from '@prisma/client'
import { sendTaxFormRejectedNotification } from 'domain/notifications/sendTaxFormRejectedNotification'
import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import { BLOCKED_STATUS, PROCESSING_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { decryptPII } from 'lib/emissaryCrypto'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { financeUserFileReviewValidator } from './validation'

interface FinanceUserFileReviewParams {
  taxFormIds: number[]
  financeUserRoleId: number
  isApproved: boolean
  rejectionReason?: string
}

export async function financeUserFileReview(params: FinanceUserFileReviewParams) {
  const { fields, errors } = await validate(financeUserFileReviewValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { taxFormIds, financeUserRoleId, isApproved, rejectionReason } = fields

  const taxForms = await prisma.userFile.findMany({
    where: {
      id: { in: taxFormIds },
      type: { in: [FileType.W8_FORM, FileType.W9_FORM] },
      isActive: true,
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  })

  if (taxForms.length !== taxFormIds.length) {
    return {
      error: {
        status: 404,
        message: errorsMessages.not_found.message,
      },
    }
  }

  const newStatus = isApproved ? SUBMITTED_STATUS : BLOCKED_STATUS

  const transferRequests = await prisma.transferRequest.findMany({
    where: {
      userFileId: { in: taxFormIds },
      status: isApproved
        ? BLOCKED_STATUS //BLOCKED and ON_HOLD mean the same
        : {
            in: [
              BLOCKED_STATUS, // ON_HOLD ia an alias for BLOCKED
              SUBMITTED_STATUS,
              REQUIRES_CHANGES_STATUS,
              PROCESSING_STATUS,
            ],
          },
      isActive: true,
      isSanctioned: false,
    },
  })

  const { data, error } = await newPrismaTransaction(async fnPrisma => {
    await fnPrisma.userFile.updateMany({
      where: {
        id: { in: taxFormIds },
      },
      data: {
        isApproved,
        rejectionReason: isApproved ? null : rejectionReason,
      },
    })

    await fnPrisma.transferRequest.updateMany({
      where: {
        id: { in: transferRequests.map(transferRequest => transferRequest.id) },
      },
      data: {
        status: newStatus,
      },
    })

    const createHistoryPromise = transferRequests.map(transferRequest => {
      const newTransferRequestValue = {
        ...transferRequest,
        status: newStatus,
      }

      return createRequestChangeHistory(fnPrisma, {
        newValue: newTransferRequestValue,
        oldValue: transferRequest,
        transferRequestId: transferRequest.id,
        userRoleId: financeUserRoleId,
      })
    })

    await Promise.all(createHistoryPromise)
  })

  if (!isApproved && rejectionReason) {
    const decryptedEmailsPromises = taxForms.map(async taxForm => decryptPII(taxForm.user.email) as Promise<string>)
    const decryptedEmails = await Promise.all(decryptedEmailsPromises)

    await sendTaxFormRejectedNotification({
      emails: decryptedEmails,
      rejectionReason,
    })
  }

  if (error) {
    return {
      error: {
        status: error.status,
        message: isApproved ? errorsMessages.error_approving_tax_form.message : errorsMessages.error_rejecting_tax_form.message,
      },
    }
  }

  return {
    data,
  }
}

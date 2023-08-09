import { sendRequiresChangeNotification } from 'domain/notifications/sendRequiresChangeNotification'
import { PROGRAM_TYPE_INTERNAL } from 'domain/programs/constants'
import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import { PROCESSING_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { decryptPII } from 'lib/emissaryCrypto'
import { TransactionError } from 'lib/errors'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { REQUIRES_CHANGES } from './constants'
import { rejectTransferRequestValidator } from './validation'

interface RequireChangeTransferRequestParams {
  transferRequestId: string
  approverId: number
  notes: string
}

export async function requireChangeTransferRequest(params: RequireChangeTransferRequestParams) {
  const { fields, errors } = await validate(rejectTransferRequestValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId, approverId, notes } = fields

  return newPrismaTransaction(async fnPrisma => {
    const [transferRequests, approverPrograms] = await Promise.all([
      fnPrisma.transferRequest.findMany({
        where: {
          publicId: transferRequestId,
          status: {
            in: [SUBMITTED_STATUS, PROCESSING_STATUS],
          },
          isActive: true,
        },
        include: {
          receiver: { select: { email: true } },
        },
      }),
      fnPrisma.userRoleProgram.findMany({
        where: {
          isActive: true,
          userRoleId: approverId,
          userRole: {
            role: {
              equals: 'APPROVER',
            },
          },
          program: {
            is: {
              isActive: true,
            },
          },
        },
        select: {
          program: {
            select: {
              id: true,
              visibility: true,
            },
          },
        },
      }),
    ])

    const [currentIteration] = transferRequests
    const currentProgram = currentIteration && approverPrograms.find(({ program }) => program.id === currentIteration.programId)

    if (!currentIteration || !currentProgram) {
      throw new TransactionError('Transfer request not found', { status: 404, errors: undefined })
    }

    const { receiver, ...currentTransferRequest } = currentIteration

    await fnPrisma.transferRequest.update({
      where: {
        id: currentTransferRequest.id,
      },
      data: {
        status: REQUIRES_CHANGES_STATUS,
      },
    })

    await fnPrisma.transferRequestApprovals.deleteMany({
      where: {
        transferRequestId: currentIteration.id,
      },
    })

    await fnPrisma.transferRequestReview.create({
      data: {
        approverId,
        transferRequestId: currentTransferRequest.id,
        status: REQUIRES_CHANGES,
        notes,
      },
    })

    const newTransferRequestValue = {
      ...currentTransferRequest,
      status: REQUIRES_CHANGES_STATUS,
    }

    await createRequestChangeHistory(fnPrisma, {
      newValue: newTransferRequestValue,
      oldValue: currentTransferRequest,
      transferRequestId: currentTransferRequest.id,
      userRoleId: approverId,
    })

    if (currentProgram?.program?.visibility !== PROGRAM_TYPE_INTERNAL) {
      const receiverEmail = await decryptPII(receiver.email)
      await sendRequiresChangeNotification({ transferRequestId, notes, email: receiverEmail })
    }

    return newTransferRequestValue
  })
}

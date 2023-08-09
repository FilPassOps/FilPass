import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import { BLOCKED_STATUS, REJECTED_BY_APPROVER_STATUS } from 'domain/transferRequest/constants'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { onHoldTransferRequestValidator } from './validation'
import { TransactionError } from 'lib/errors'

interface OnHoldTransferRequestParams {
  transferRequestId: string
  approverId: number
}

export async function onHoldTransferRequest(params: OnHoldTransferRequestParams) {
  const { fields, errors } = await validate(onHoldTransferRequestValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  if (!fields) return { error: { status: 400, errors: undefined } }

  const { transferRequestId, approverId } = fields

  const { data, error } = await newPrismaTransaction(async fnPrisma => {
    const [transferRequests, approverPrograms] = await Promise.all([
      fnPrisma.transferRequest.findMany({
        where: {
          publicId: transferRequestId,
          status: {
            in: [REJECTED_BY_APPROVER_STATUS],
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
    const currentProgram = approverPrograms.find(({ program }) => program.id === currentIteration?.programId)

    if (!currentIteration || !currentProgram) {
      throw new TransactionError('Transfer request not found', { status: 404, errors: undefined })
    }

    await fnPrisma.transferRequest.update({
      where: {
        id: currentIteration.id,
      },
      data: {
        status: BLOCKED_STATUS,
      },
    })

    const { ...oldTransferRequestValue } = currentIteration
    const newTransferRequestValue = {
      ...oldTransferRequestValue,
      status: BLOCKED_STATUS,
    }

    await fnPrisma.transferRequestReview.create({
      data: {
        approverId,
        transferRequestId: oldTransferRequestValue.id,
        status: BLOCKED_STATUS,
      },
    })

    await createRequestChangeHistory(fnPrisma, {
      newValue: newTransferRequestValue,
      oldValue: oldTransferRequestValue,
      transferRequestId: oldTransferRequestValue.id,
      userRoleId: approverId,
    })

    return newTransferRequestValue
  })

  if (error) {
    return {
      error: {
        status: error.status,
        message: errorsMessages.error_blocking_transfer_request.message,
      },
    }
  }

  return {
    data,
  }
}

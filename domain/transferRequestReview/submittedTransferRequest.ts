import { Prisma, PrismaClient } from '@prisma/client'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import {
  APPROVED_STATUS,
  PROCESSING_STATUS,
  REJECTED_BY_APPROVER_STATUS,
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_BY_APPROVER_STATUS,
  SUBMITTED_STATUS,
} from 'domain/transferRequest/constants'
import { getPrismaClient, newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { submittedTransferRequestValidator } from './validation'

interface SubmittedTransferRequestParams {
  transferRequestId: string
  approverId: number
}

export async function submittedTransferRequest(params: SubmittedTransferRequestParams) {
  const { fields, errors } = await validate(submittedTransferRequestValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId, approverId } = fields
  const prisma: PrismaClient = await getPrismaClient()

  const [transferRequests, approverPrograms] = await Promise.all([
    prisma.transferRequest.findMany({
      where: {
        publicId: transferRequestId,
        status: {
          in: [APPROVED_STATUS, REJECTED_BY_APPROVER_STATUS, REQUIRES_CHANGES_STATUS, PROCESSING_STATUS],
        },
        isActive: true,
      },
      include: {
        requester: {
          select: {
            roles: true,
          },
        },
        _count: {
          select: {
            approvals: true,
          },
        },
      },
    }),
    prisma.userRoleProgram.findMany({
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
            deliveryMethod: true,
          },
        },
      },
    }),
  ])

  const [currentIteration] = transferRequests

  const currentProgram = currentIteration && approverPrograms.find(({ program }) => program.id === currentIteration.programId)

  if (!currentIteration || !currentProgram) {
    return {
      error: {
        status: 404,
        message: errorsMessages.transfer_request_not_found.message,
      },
    }
  }

  const { data, error } = await newPrismaTransaction(async fnPrisma => {
    const { count: deleted } = await fnPrisma.transferRequestApprovals.deleteMany({
      where: {
        transferRequestId: currentIteration.id,
        userRoleId: approverId,
      },
    })

    if (currentIteration._count.approvals - deleted > 0) {
      await fnPrisma.transferRequest.update({
        where: {
          publicId: transferRequestId,
        },
        data: {
          status: 'PROCESSING',
        },
      })

      return {
        ...currentIteration,
        status: PROCESSING_STATUS,
      }
    }

    if (currentIteration.status === REJECTED_BY_APPROVER_STATUS || currentIteration.status === REQUIRES_CHANGES_STATUS) {
      const transferRequestReview = await fnPrisma.transferRequestReview.findFirst({
        where: {
          status: currentIteration.status === REJECTED_BY_APPROVER_STATUS ? 'REJECTED' : currentIteration.status,
          transferRequestId: currentIteration.id,
          isActive: true,
        },
        orderBy: {
          id: 'desc',
        },
      })

      if (transferRequestReview?.id) {
        await fnPrisma.transferRequestReview.update({
          where: {
            id: transferRequestReview.id,
          },
          data: {
            isActive: false,
          },
        })
      }
    }

    const hasApproverRole = currentIteration.requester?.roles.find(({ role }) => role === APPROVER_ROLE)
    const status = hasApproverRole ? SUBMITTED_BY_APPROVER_STATUS : SUBMITTED_STATUS

    await fnPrisma.transferRequest.update({
      where: {
        publicId: transferRequestId,
      },
      data: {
        status,
      },
    })

    const newTransferRequestValue = {
      ...currentIteration,
      status,
    }

    await createRequestChangeHistory(fnPrisma, {
      newValue: newTransferRequestValue,
      oldValue: currentIteration,
      transferRequestId: currentIteration.id,
      userRoleId: approverId,
    })

    return newTransferRequestValue
  })

  if (error) {
    return {
      error: {
        status: error.status,
        message: errorsMessages.error_approving_transfer_request.message,
      },
    }
  }

  return {
    data,
  }
}

interface SubmittedTransferRequestsBySuperParams {
  transferRequestIds: number[]
  fnPrisma: Prisma.TransactionClient
  superId: number
}

export async function submittedTransferRequestsBySuper({ transferRequestIds, fnPrisma, superId }: SubmittedTransferRequestsBySuperParams) {
  const prisma: PrismaClient = await getPrismaClient()

  const requests = await prisma.transferRequest.findMany({
    where: {
      id: {
        in: transferRequestIds,
      },
      status: PROCESSING_STATUS,
      isActive: true,
    },
    include: {
      requester: {
        select: {
          roles: true,
        },
      },
    },
  })

  await fnPrisma.transferRequestApprovals.deleteMany({
    where: {
      transferRequestId: {
        in: transferRequestIds,
      },
    },
  })

  for (const request of requests) {
    const hasApproverRole = request.requester?.roles.find(({ role }) => role === APPROVER_ROLE)
    const status = hasApproverRole ? SUBMITTED_BY_APPROVER_STATUS : SUBMITTED_STATUS

    await fnPrisma.transferRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status,
      },
    })

    const newTransferRequestValue = {
      ...request,
      status,
    }

    await createRequestChangeHistory(fnPrisma, {
      newValue: newTransferRequestValue,
      oldValue: request,
      transferRequestId: request.id,
      userRoleId: superId,
    })
  }
}

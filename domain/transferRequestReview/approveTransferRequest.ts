import { sendApprovedNotification } from 'domain/notifications/sendApprovedNotification'
import { PROGRAM_TYPE_INTERNAL } from 'domain/programs/constants'
import { APPROVED_STATUS, PROCESSING_STATUS, SUBMITTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { approveTransferRequestValidator } from './validation'

interface ApproverTransferRequestParams {
  transferRequestId: string
  approverId: number
}

export async function approveTransferRequest(params: ApproverTransferRequestParams) {
  const { fields, errors } = await validate(approveTransferRequestValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId, approverId } = fields

  const { approvedRequests, failedRequests } = await batchApproveTransferRequest({
    requests: [transferRequestId],
    approverId,
  })

  return approvedRequests[0] || failedRequests[0]
}

interface BatchApproveTransferRequestParams {
  requests: string[]
  approverId: number
}

export async function batchApproveTransferRequest(params: BatchApproveTransferRequestParams) {
  const { requests, approverId } = params

  const transferRequests = await prisma.transferRequest.findMany({
    where: {
      isActive: true,
      publicId: { in: requests },
      status: { in: [SUBMITTED_STATUS, SUBMITTED_BY_APPROVER_STATUS, PROCESSING_STATUS] },
      program: {
        userRolePrograms: {
          some: {
            isActive: true,
            userRoleId: approverId,
          },
        },
      },
    },
    select: {
      id: true,
      publicId: true,
      programId: true,
      status: true,
      expectedTransferDate: true,
      program: {
        select: {
          deliveryMethod: true,
          visibility: true,
          userRoleProgramGroups: {
            select: {
              id: true,
              userRoleProgramGroupMembers: {
                select: {
                  userRoleProgram: {
                    select: {
                      userRoleId: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      receiver: {
        select: {
          email: true,
        },
      },
      approvals: {
        select: {
          userRoleProgramGroupId: true,
        },
      },
    },
  })

  if (transferRequests.length !== requests.length) {
    throw new Error(errorsMessages.transfer_request_not_found.message)
  }

  const approvedRequests: typeof transferRequests = []
  const failedRequests: typeof transferRequests = []
  for (const request of transferRequests) {
    const { program } = request

    //old programs may not have an approver group - a group can be empty
    const numberOfProgramApproversGroups = program.userRoleProgramGroups.filter(
      group => group.userRoleProgramGroupMembers.length > 0
    ).length

    try {
      const approverGroups = program.userRoleProgramGroups.filter(
        group => group.userRoleProgramGroupMembers.filter(member => member.userRoleProgram.userRoleId === approverId).length > 0
      )
      const alreadyApprovedByGroup =
        approverGroups.length &&
        approverGroups.every(group => request.approvals.some(approval => approval.userRoleProgramGroupId === group.id))

      if (alreadyApprovedByGroup) continue

      const result = await prisma.$transaction(async tx => {
        if (request.program.userRoleProgramGroups.length) {
          const numberOfApprovals = request.approvals.length
          const { count: newApprovals } = await tx.transferRequestApprovals.createMany({
            data: approverGroups
              .filter(group => !request.approvals.some(app => app.userRoleProgramGroupId === group.id))
              .map(group => ({
                transferRequestId: request.id,
                userRoleProgramGroupId: group.id,
                userRoleId: approverId,
              })),
          })
          if (numberOfApprovals + newApprovals < numberOfProgramApproversGroups) {
            if (!numberOfApprovals) {
              await tx.transferRequest.update({
                where: {
                  publicId: request.publicId,
                  status: request.status,
                },
                data: {
                  status: 'PROCESSING',
                },
              })
              await tx.transferRequestHistory.create({
                data: {
                  transferRequestId: request.id,
                  newValue: PROCESSING_STATUS,
                  oldValue: request.status.toString(),
                  field: 'status',
                  userRoleId: approverId,
                },
              })
            }
            return request
          }
        }
        await tx.transferRequest.update({
          where: {
            id: request.id,
            status: request.status,
          },
          data: {
            status: 'APPROVED',
          },
        })
        await tx.transferRequestReview.create({
          data: {
            approverId,
            transferRequestId: request.id,
            status: 'APPROVED',
          },
        })
        await tx.transferRequestHistory.create({
          data: {
            transferRequestId: request.id,
            newValue: APPROVED_STATUS,
            oldValue: request.status.toString(),
            field: 'status',
            userRoleId: approverId,
          },
        })
        return request
      })
      approvedRequests.push(result)
    } catch (error) {
      console.error(error)
      console.error(JSON.stringify(request))
      failedRequests.push(request)
    }
  }

  for (const request of approvedRequests) {
    if (request.program.visibility !== PROGRAM_TYPE_INTERNAL) {
      sendApprovedNotification({
        encryptedEmail: request.receiver.email,
        transferRequestId: request.publicId,
        expectedTransferDate: request.expectedTransferDate,
      })
    }
  }

  return {
    approvedRequests,
    failedRequests,
  }
}

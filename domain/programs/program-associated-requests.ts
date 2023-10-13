import { TransferRequestStatus } from '@prisma/client'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { programAssociatedRequestsValidator } from './validation'

interface ProgramAssociatedRequestsParams {
  programId?: number
}

export async function programAssociatedRequests(params: ProgramAssociatedRequestsParams) {
  const { fields, errors } = await validate(programAssociatedRequestsValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { programId } = fields

  const associatedTransferRequests = await prisma.transferRequest.findMany({
    where: {
      programId,
      isActive: true,
      status: {
        notIn: [
          TransferRequestStatus.PAID,
          TransferRequestStatus.REJECTED_BY_APPROVER,
          TransferRequestStatus.REJECTED_BY_CONTROLLER,
          TransferRequestStatus.VOIDED,
        ],
      },
    },
    select: {
      publicId: true,
    },
  })
  const associatedDraftRequests = await prisma.transferRequestDraft.findMany({
    where: {
      programId,
      isActive: true,
      isSubmitted: false,
    },
    select: {
      publicId: true,
    },
  })

  const associatedRequests = [...associatedTransferRequests.map(r => ({ publicId: r.publicId })), ...associatedDraftRequests]

  return { data: associatedRequests }
}

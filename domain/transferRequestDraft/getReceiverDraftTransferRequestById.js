import { decrypt, decryptPII } from 'lib/emissaryCrypto'
import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import _get from 'lodash/get'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { DRAFT_STATUS } from '../transferRequest/constants'
import { getReceiverDraftTransferRequestByIdValidator } from './validation'

export async function getReceiverDraftTransferRequestById(params) {
  const { fields, errors } = await validate(getReceiverDraftTransferRequestByIdValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }
  const { transferRequestId, receiverId } = fields
  const prisma = await getPrismaClient()

  const [transferRequestDraft] = await prisma.transferRequestDraft.findMany({
    where: {
      publicId: transferRequestId,
      isActive: true,
      isSubmitted: false,
      receiverId,
    },
    include: {
      receiver: {
        select: {
          email: true,
        },
      },
      requester: {
        select: {
          email: true,
          id: true,
        },
      },
      program: {
        include: {
          programCurrency: {
            select: {
              currency: true,
              type: true,
            },
          },
        },
      },
      attachment: true,
    },
  })

  if (!transferRequestDraft) {
    return {
      error: {
        status: 404,
        message: errorsMessages.not_found.message,
      },
    }
  }

  return {
    data: {
      id: transferRequestDraft.publicId,
      isDraft: true,
      isEditable: true,
      isActive: transferRequestDraft.isActive,
      isSubmitted: transferRequestDraft.isSubmitted,
      amount: await decrypt(transferRequestDraft.amount),
      team: await decryptPII(transferRequestDraft.team),
      status: DRAFT_STATUS,
      created_at: transferRequestDraft.createdAt,
      program_id: transferRequestDraft.program.id,
      program_name: transferRequestDraft.program.name,
      program_visibility: transferRequestDraft.program.visibility,
      programCurrency: transferRequestDraft.program.programCurrency,
      receiver: await decryptPII(_get(transferRequestDraft, 'receiver.email', '')),
      applyer: await decryptPII(_get(transferRequestDraft, 'requester.email', '')),
      applyerId: transferRequestDraft.requesterId,
      attachment_id: _get(transferRequestDraft, 'attachment.publicId', undefined),
    },
  }
}

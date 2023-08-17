import { decrypt, decryptPII } from 'lib/emissaryCrypto'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import _get from 'lodash/get'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { DRAFT_STATUS } from '../transferRequest/constants'
import { getDraftTransferRequestByIdValidator } from './validation'

interface GetDraftTransferRequestByIdParams {
  transferRequestId: string
}

export async function getDraftTransferRequestById(params: GetDraftTransferRequestByIdParams) {
  const { fields, errors } = await validate(getDraftTransferRequestByIdValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }
  const { transferRequestId } = fields

  const [transferRequestDraft] = await prisma.transferRequestDraft.findMany({
    where: {
      publicId: transferRequestId,
      isActive: true,
      isSubmitted: false,
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
        select: {
          id: true,
          name: true,
          deliveryMethod: true,
          programCurrency: {
            select: {
              type: true,
              currency: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      currency: {
        select: {
          name: true,
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

  const applyer = await decryptPII(_get(transferRequestDraft, 'requester.email', ''))
  return {
    data: {
      id: transferRequestDraft?.publicId,
      isDraft: true,
      isEditable: true,
      isActive: transferRequestDraft.isActive,
      isSubmitted: transferRequestDraft.isSubmitted,
      amount: await decrypt(transferRequestDraft.amount),
      team: await decryptPII(transferRequestDraft.team),
      status: DRAFT_STATUS,
      created_at: transferRequestDraft.createdAt,
      program_id: transferRequestDraft.programId,
      program_name: transferRequestDraft.program.name,
      program_delivery_method: transferRequestDraft.program.deliveryMethod,
      request_unit: transferRequestDraft.currency.name,
      payment_unit: transferRequestDraft.program.programCurrency.find(curr => curr.type === 'PAYMENT')?.currency.name,
      receiver: await decryptPII(transferRequestDraft.receiver.email),
      applyer,
      applyerId: transferRequestDraft.requesterId,
      attachment_id: _get(transferRequestDraft, 'attachment.publicId', undefined),
      attachment_filename: _get(transferRequestDraft, 'attachment.filename', undefined),
      attachment_user_email: applyer,
    },
  }
}

import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { getReceiverDraftTransferRequestById } from 'domain/transferRequestDraft/getReceiverDraftTransferRequestById'
import { getTransferRequestById } from './getTransferRequestById'
import { getUserTransferRequestByIdValidator } from './validation'

export async function getUserTransferRequestById(params) {
  const { fields, errors } = await validate(getUserTransferRequestByIdValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId, userId } = fields
  const prisma = await getPrismaClient()
  const [transferRequest] = await prisma.transferRequest.findMany({
    where: {
      publicId: transferRequestId,
      isActive: true,
      receiverId: userId,
    },
    select: {
      id: true,
    },
  })

  if (!transferRequest) {
    const { data: draft, error: draftError } = await getReceiverDraftTransferRequestById({
      receiverId: userId,
      transferRequestId,
    })

    if (draftError) {
      return {
        error: {
          status: 404,
          message: errorsMessages.not_found.message,
        },
      }
    }

    return {
      data: draft,
    }
  }

  return getTransferRequestById({ transferRequestId })
}

import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { deleteDraftTransferRequestByIdValidator } from './validation'

interface DeleteDraftTransferRequestByIdParams {
  userId: number
  publicId: string
}

export async function deleteDraftTransferRequestById(params: DeleteDraftTransferRequestByIdParams) {
  const { fields, errors } = await validate(deleteDraftTransferRequestByIdValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }
  const { userId, publicId } = fields

  const deletedDraft = await prisma.transferRequestDraft.updateMany({
    where: {
      publicId,
      OR: [
        {
          receiverId: userId,
        },
        {
          requesterId: userId,
        },
      ],
    },
    data: {
      isActive: false,
    },
  })

  if (deletedDraft.count <= 0) {
    return {
      error: {
        status: 500,
        errors: {
          message: errorsMessages.error_deleting_transfer_request.message,
        },
      },
    }
  }

  return {
    data: deletedDraft,
  }
}

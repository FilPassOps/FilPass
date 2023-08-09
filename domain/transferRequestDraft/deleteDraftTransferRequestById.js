import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { deleteDraftTransferRequestByIdValidator } from './validation'

export async function deleteDraftTransferRequestById(params) {
  const { fields, errors } = await validate(deleteDraftTransferRequestByIdValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }
  const { userId, publicId } = fields
  const prisma = await getPrismaClient()

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

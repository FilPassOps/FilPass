import { REQUIRES_CHANGES_STATUS, SUBMITTED_STATUS } from 'domain/transfer-request/constants'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages, { parametrizedErrorsMessages } from 'wordings-and-errors/errors-messages'
import { removeFileValidator } from './validation'
import { User } from '@prisma/client'

interface DeleteFileParams {
  id: string
}

export async function deleteFile(params: DeleteFileParams, user: User) {
  const { id: userId } = user
  const { fields, errors } = await validate(removeFileValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { id } = fields

  const [fileData] = await prisma.userFile.findMany({ where: { publicId: id ?? null, userId } })

  if (!fileData) {
    return {
      error: {
        status: 404,
        message: errorsMessages.not_found.message,
      },
    }
  }

  const activeTranferRequests = await prisma.transferRequest.findMany({
    where: {
      userFileId: fileData.id,
      isActive: true,
      status: { in: [SUBMITTED_STATUS, REQUIRES_CHANGES_STATUS] },
    },
    select: {
      publicId: true,
    },
  })

  if (activeTranferRequests.length) {
    const publicIds = activeTranferRequests.map(({ publicId }) => publicId)
    return {
      error: {
        status: 400,
        message: parametrizedErrorsMessages.file_has_active_transfer_request.message(publicIds),
      },
    }
  }

  const data = await prisma.userFile.update({
    where: { publicId: id },
    data: { isActive: false },
    select: {
      publicId: true,
      filename: true,
      type: true,
    },
  })

  return { data }
}

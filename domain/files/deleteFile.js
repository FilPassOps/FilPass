import { REQUIRES_CHANGES_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { removeFileValidator } from './validation'

export async function deleteFile(params, user) {
  const { id: userId } = user
  const { fields, errors } = await validate(removeFileValidator, params)

  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { id } = fields
  const prisma = await getPrismaClient()

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
        message: errorsMessages.file_has_active_transfer_request.message(publicIds),
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
      isApproved: true,
    },
  })

  return { data }
}

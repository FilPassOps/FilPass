import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { removeFileValidator } from './validation'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface DeleteTemporaryFileParams {
  id?: string
}

export async function deleteTemporaryFile(params: DeleteTemporaryFileParams) {
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

  const [fileData] = await prisma.temporaryFile.findMany({ where: { publicId: id, isActive: true } })

  if (!fileData) {
    return {
      error: {
        status: 404,
        message: errorsMessages.not_found.message,
      },
    }
  }

  const data = await prisma.temporaryFile.update({
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

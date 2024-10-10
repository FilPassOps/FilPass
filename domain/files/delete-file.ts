import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
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

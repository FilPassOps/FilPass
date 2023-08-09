import { getFile } from 'lib/fileUpload'
import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import { filetypemime } from 'magic-bytes.js'
import { getTempFileValidator } from './validation'

export async function getTemporaryFile(params) {
  const { fields, errors } = await validate(getTempFileValidator, params)

  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { publicId, uploaderId } = fields

  const prisma = await getPrismaClient()

  const file = await prisma.temporaryFile.findFirst({
    where: { publicId, uploaderId },
  })

  if (!file) {
    return {
      error: {
        status: 404,
        errors: {
          file: 'Key not found',
        },
      },
    }
  }

  const { data, error } = await getFile({ key: file.key })
  if (error) {
    console.log('Failed to get file.', ` status:${error.status}`, ` message:${error.message}`)
    return {
      error: {
        status: error.status,
        message: 'Failed to get file. Please, try again.',
      },
    }
  }

  return {
    data: {
      file: data,
      info: filetypemime(data),
    },
  }
}

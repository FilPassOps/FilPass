import { uploadFileToS3Temp } from 'lib/file-upload'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { createTemporaryFileValidator } from './validation'

interface CreateTemporaryFileParams {
  uploaderId: number
  type: string
  file: {
    originalname: string
    size: number
    mimetype: string
    path: string
    filename: string
  }
}

export async function createTemporaryFile(params: CreateTemporaryFileParams) {
  const { fields, errors } = await validate(createTemporaryFileValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { type, file, uploaderId } = fields

  const { error, data: uploadedFile } = await uploadFileToS3Temp({ file, type })

  if (error) {
    return { error }
  }

  const createdFile = await prisma.temporaryFile.create({
    data: {
      filename: file.originalname,
      type,
      key: uploadedFile.key,
      uploaderId,
    },
    select: {
      publicId: true,
      filename: true,
      type: true,
    },
  })

  return {
    data: createdFile,
  }
}

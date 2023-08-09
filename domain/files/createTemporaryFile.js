import { uploadFileToS3Temp } from 'lib/fileUpload'
import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import { createTemporaryFileValidator } from './validation'

export async function createTemporaryFile(params) {
  const { fields, errors } = await validate(createTemporaryFileValidator, params)

  if (errors) {
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

  const prisma = await getPrismaClient()

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

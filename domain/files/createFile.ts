import { uploadFileToS3 } from 'lib/fileUpload'
import { validate } from 'lib/yup'
import { createFileValidator } from './validation'
import { logger } from 'lib/logger'
import prisma from 'lib/prisma'

const MAX_FILE_SIZE = 3145728
const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/heic', 'application/pdf']

interface CreateFileParams {
  userId?: number
  uploaderId?: number
  type: string
  setAsActive: boolean
  file: {
    originalname: string
    size: number
    mimetype: string
    path: string
    filename: string
  }
}

export async function createFile(params: CreateFileParams) {
  const { fields, errors } = await validate(createFileValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { type, file, userId, uploaderId, setAsActive } = fields

  if (file.size > MAX_FILE_SIZE) {
    logger.error('File too large', file.size)
    return { error: { status: 400, message: 'Maximum file size is 3MB.' } }
  }

  if (!ACCEPTED_FILE_TYPES.find(type => type === file.mimetype)) {
    logger.error('Unsupported file type', file.mimetype)
    return { error: { status: 400, message: 'Unsupported file type, please upload a png, jpeg, pdf, heic file.' } }
  }

  if (!userId) {
    logger.error('Missing userId')
    return { error: { status: 400, message: 'Missing userId or uploaderId' } }
  }

  const { error, data: uploadedFile } = await uploadFileToS3({ file, type, userId })

  if (error) {
    return { error }
  }

  const createdFile = await prisma.userFile.create({
    data: {
      userId,
      filename: file.originalname,
      type,
      key: uploadedFile.key,
      uploaderId: uploaderId || userId,
      isActive: setAsActive,
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

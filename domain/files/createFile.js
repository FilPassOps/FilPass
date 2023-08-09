import { uploadFileToS3 } from 'lib/fileUpload'
import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import { createFileValidator } from './validation'

const MAX_FILE_SIZE = 3145728
const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/heic', 'application/pdf']

export async function createFile(params) {
  const { fields, errors } = await validate(createFileValidator, params)

  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { type, file, userId, uploaderId, setAsActive } = fields

  if (file.size > MAX_FILE_SIZE) {
    console.log('file too large')
    return { error: { status: 400, message: 'Maximum file size is 3MB.' } }
  }

  if (!ACCEPTED_FILE_TYPES.find(type => type === file.mimetype)) {
    console.log('unsupported file type')
    return { error: { status: 400, message: 'Unsupported file type, please upload a png, jpeg, pdf, heic file.' } }
  }

  const { error, data: uploadedFile } = await uploadFileToS3({ file, type, userId })

  if (error) {
    return { error }
  }

  const prisma = await getPrismaClient()

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
      isApproved: true,
    },
  })

  return {
    data: createdFile,
  }
}

import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { archiveProgramValidator } from './validation'

interface UpdateProgramArchiveStatusParams {
  id?: number
  isArchived?: boolean
}

interface ArchiveProgramParams {
  id?: number
}

interface UnarchiveProgramParams {
  id?: number
}

export async function updateProgramArchiveStatus(params: UpdateProgramArchiveStatusParams) {
  const { fields, errors } = await validate(archiveProgramValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { id, isArchived } = fields

  const { count } = await prisma.program.updateMany({
    where: {
      id,
      isActive: true,
      isArchived: !!isArchived,
    },
    data: {
      isArchived: !isArchived,
    },
  })

  if (count <= 0) {
    return {
      error: {
        status: 404,
        message: errorsMessages.not_found.message,
      },
    }
  }

  return { data: { count } }
}

export async function unarchiveProgram(params: ArchiveProgramParams) {
  return await updateProgramArchiveStatus({ ...params, isArchived: true })
}

export async function archiveProgram(params: UnarchiveProgramParams) {
  return await updateProgramArchiveStatus({ ...params, isArchived: false })
}

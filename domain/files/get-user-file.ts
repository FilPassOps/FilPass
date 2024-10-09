import { Prisma, UserFile } from '@prisma/client'
import { getFile, getReadStream } from 'lib/file-upload'
import { SessionUser } from 'lib/middleware'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { filetypemime } from 'magic-bytes.js'
import { getFileValidator } from './validation'
import { logger } from 'lib/logger'

interface GetUserFileParams {
  filePublicId: string
  user: SessionUser
}

export async function getUserFileReadStream(params: GetUserFileParams) {
  const { file, error } = await getFileDetails(params)

  if (error) {
    return { error }
  }

  const { error: awsError, data } = await getReadStream({ key: file.key })

  if (awsError) {
    logger.error('Failed to get file read stream.', ` status:${awsError.status}`, ` message:${awsError.errors.file}`)
    return {
      error: {
        status: awsError.status,
        message: 'Failed to get file. Please, try again.',
      },
    }
  }

  return {
    data: {
      readStream: data,
      fileName: file.filename,
    },
  }
}

export async function getUserFile(params: GetUserFileParams) {
  const { file, error } = await getFileDetails(params)

  if (error) {
    return error
  }

  const { data, error: awsError } = await getFile({ key: file.key })

  if (awsError) {
    logger.error('Failed to get file.', ` status:${awsError.status}`, ` message:${awsError.message}`)
    return {
      error: {
        status: awsError.status,
        message: 'Failed to get file. Please, try again.',
      },
    }
  }

  return {
    data: {
      file: data,
      info: filetypemime(Array.from(data)),
    },
  }
}

async function getFileDetails(params: GetUserFileParams) {
  const { id: userId } = params.user
  const { fields, errors } = await validate(getFileValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { filePublicId } = fields

  let query = Prisma.sql`SELECT * FROM user_file uf WHERE uf.public_id = ${filePublicId} AND uf.user_id = ${userId}`

  query = Prisma.sql`
    SELECT
    uf.*
    FROM
    user_file uf
    INNER JOIN transfer_request tr ON
    tr.user_file_id = uf.id AND tr.status::text = 'PAID'
    INNER JOIN "program" p ON
    tr.program_id = p.id
    AND p.is_active is true
    INNER JOIN user_role_program urp ON
    urp.program_id = p.id
    AND urp.is_active is true
    INNER JOIN user_role ur ON
    ur.id = urp.user_role_id
    AND ur.role::text = 'VIEWER'
    AND ur.user_id = ${userId}
    WHERE
    uf.public_id = ${filePublicId}
    UNION
    SELECT uf.* FROM user_file uf WHERE uf.public_id = ${filePublicId}
    LIMIT 1;
    `

  const [file] = await prisma.$queryRaw<UserFile[]>(query)

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

  return { file }
}

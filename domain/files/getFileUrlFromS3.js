import { APPROVER_ROLE, CONTROLLER_ROLE } from 'domain/auth/constants'
import { getFile } from 'lib/fileUpload'
import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import { getFileUrlFromS3Validator } from './validation'

export async function getFileUrlFromS3(params) {
  const { fields, errors } = await validate(getFileUrlFromS3Validator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId, userId } = fields
  const prisma = await getPrismaClient()

  const [file] = await prisma.$queryRaw`
  SELECT user_file.key
  FROM transfer_request
          INNER JOIN user_file ON transfer_request.user_file_id = user_file.id
          LEFT JOIN (SELECT user_role.role,
                            user_role_program.program_id
                      FROM user_role
                              LEFT JOIN user_role_program ON user_role_program.user_role_id = user_role.id AND
                                                              user_role_program.is_active = TRUE
                      WHERE user_role.user_id = ${userId}
                        AND user_role.is_active = TRUE
                        AND (user_role.role::text = ${APPROVER_ROLE} OR user_role.role::text = ${CONTROLLER_ROLE})
  ) user_roles_filter ON user_roles_filter.role::text = ${CONTROLLER_ROLE}
      OR (user_roles_filter.role::text = ${APPROVER_ROLE} AND user_roles_filter.program_id = transfer_request.program_id)
  WHERE transfer_request.public_id = ${transferRequestId}
    AND (transfer_request.requester_id = ${userId}
      OR transfer_request.receiver_id = ${userId}
      OR user_roles_filter.role IS NOT NULL)
  `
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
    data,
  }
}

import { decrypt, decryptPII } from 'lib/emissaryCrypto'
import { getPrismaClient } from 'lib/prisma'
import { validate } from 'lib/yup'
import { HISTORY_ENCRYPTED_FIELDS_AMOUNT, HISTORY_ENCRYPTED_FIELDS_TEAM } from './constants'
import { getHistoryValidator } from './validation'

export async function getRequestHistoryByRequestPublicId(params) {
  const { fields, errors } = await validate(getHistoryValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId } = fields
  const prisma = await getPrismaClient()

  const history = await prisma.$queryRaw`
    SELECT history.id,
        history.created_at,
        history.field,
        app_user.email,
        MAX(CASE
                WHEN history.field = 'programId'
                    THEN CASE WHEN program.id = history.newProgramId THEN program.name END
                WHEN history.field = 'userWalletId'
                    THEN CASE
                            WHEN user_wallet.id = history.newWalletId
                              THEN COALESCE(NULLIF(user_wallet.name, ''), user_wallet.address) END
                WHEN history.field = 'userFileId'
                    THEN CASE WHEN user_file.id = history.newFileId THEN user_file.filename END
                WHEN history.field = 'attachmentId'
                    THEN CASE WHEN attachment.id = history.newAttachmentId THEN attachment.filename END
                ELSE history.new_value
            END) new_value,
        MAX(CASE
                WHEN history.field = 'programId'
                    THEN CASE WHEN program.id = history.oldProgramId THEN program.name END
                WHEN history.field = 'userWalletId'
                    THEN CASE
                            WHEN user_wallet.id = history.oldWalletId
                              THEN COALESCE(NULLIF(user_wallet.name, ''), user_wallet.address) END
                WHEN history.field = 'userFileId'
                    THEN CASE WHEN user_file.id = history.oldFileId THEN user_file.filename END
                WHEN history.field = 'attachmentId'
                    THEN CASE WHEN attachment.id = history.oldAttachmentId THEN attachment.filename END
                ELSE history.old_value
            END) old_value
    FROM transfer_request
          INNER JOIN
      (SELECT id,
              created_at,
              field,
              old_value,
              new_value,
              user_role_id,
              transfer_request_id,
              CASE WHEN field = 'programId'    THEN new_value::INT END  newProgramId,
              CASE WHEN field = 'programId'    THEN old_value::INT END  oldProgramId,
              CASE WHEN field = 'userWalletId' THEN new_value::INT END  newWalletId,
              CASE WHEN field = 'userWalletId' THEN old_value::INT END  oldWalletId,
              CASE WHEN field = 'userFileId'   THEN new_value::INT END  newFileId,
              CASE WHEN field = 'userFileId'   THEN old_value::INT END  oldFileId,
              CASE WHEN field = 'attachmentId' THEN new_value::INT END  newAttachmentId,
              CASE WHEN field = 'attachmentId' THEN old_value::INT END  oldAttachmentId
        FROM transfer_request_history
        WHERE is_active = true) history ON history.transfer_request_id = transfer_request.id
          INNER JOIN user_role ON user_role.id = history.user_role_id
          INNER JOIN "user" app_user ON app_user.id = user_role.user_id
          LEFT JOIN program ON program.id IN (history.oldProgramId, history.newProgramId)
          LEFT JOIN user_wallet ON user_wallet.id IN (history.newWalletId, history.oldWalletId)
          LEFT JOIN user_file ON user_file.id IN (history.newFileId, history.oldFileId)
          LEFT JOIN user_file AS attachment ON attachment.id IN (history.newAttachmentId, history.oldAttachmentId)
    WHERE transfer_request.is_active = TRUE
      AND transfer_request.public_id = ${transferRequestId}
    GROUP BY history.id,
          history.created_at,
          history.field,
          app_user.email
    ORDER BY history.created_at DESC;
  `

  const deryptedHistory = await Promise.all(
    history.map(async row => {
      if (row.field === HISTORY_ENCRYPTED_FIELDS_TEAM) {
        const [decryptedEmail, decryptedOldValue, decryptedNewValue] = await Promise.all([
          decryptPII(row.email),
          decryptPII(row.old_value),
          decryptPII(row.new_value),
        ])
        return {
          ...row,
          email: decryptedEmail,
          old_value: decryptedOldValue,
          new_value: decryptedNewValue,
        }
      }

      if (row.field === HISTORY_ENCRYPTED_FIELDS_AMOUNT) {
        const [decryptedEmail, decryptedOldValue, decryptedNewValue] = await Promise.all([
          decryptPII(row.email),
          decrypt(row.old_value),
          decrypt(row.new_value),
        ])
        return {
          ...row,
          email: decryptedEmail,
          old_value: decryptedOldValue,
          new_value: decryptedNewValue,
        }
      }

      const decryptedEmail = await decryptPII(row.email)
      return {
        ...row,
        email: decryptedEmail,
      }
    })
  )

  return {
    data: deryptedHistory,
  }
}

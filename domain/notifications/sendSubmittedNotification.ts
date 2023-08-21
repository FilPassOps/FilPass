import { decryptPII } from 'lib/emissaryCrypto'
import prisma from 'lib/prisma'
import { sendEmail } from 'lib/sendEmail'
import { validate } from 'lib/yup'
import { baseEmail } from './constants'
import { sendSubmittedNotificationValidator } from './validation'
import { logger } from 'lib/logger'

interface SendSubmittedNotificationParams {
  programId: number
  transferRequestId: string
}

interface NotifyApproverParams {
  encryptedEmail: string
  transferRequestId: string
}

interface Approver {
  approver_email: string
}

interface GetBodyParams {
  transferRequestId: string
}

export async function sendSubmittedNotification(params: SendSubmittedNotificationParams) {
  const { fields, errors } = await validate(sendSubmittedNotificationValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { programId, transferRequestId } = fields

  const approvers = await prisma.$queryRaw<Approver[]>`
    SELECT
      user_role_user.email                  approver_email
    FROM program
      INNER JOIN user_role_program ON user_role_program.program_id = program.id AND user_role_program.is_active = TRUE
      INNER JOIN user_role ON user_role.id = user_role_program.user_role_id AND user_role.is_active = TRUE AND user_role.role::text = 'APPROVER'
      INNER JOIN "user" AS user_role_user ON user_role_user.id = user_role.user_id AND user_role_user.is_active = TRUE
    WHERE program.id = ${programId} AND program.is_active = TRUE
  `

  return Promise.all(approvers.map(async approver => notifyApprover({ encryptedEmail: approver.approver_email, transferRequestId })))
}

async function notifyApprover({ encryptedEmail, transferRequestId }: NotifyApproverParams) {
  let decryptedEmail

  try {
    decryptedEmail = await decryptPII(encryptedEmail)
  } catch (error) {
    logger.error(`Failed to notify approver - could not decrypt email for transferRequestId:${transferRequestId}`, error)
    return
  }

  const emailBody = baseEmail(getBody({ transferRequestId }))

  try {
    await sendEmail({
      to: decryptedEmail,
      subject: 'Transfer request for review',
      html: emailBody,
    })
  } catch (error) {
    logger.error(`Failed to notify approver - could not send email for transferRequestId:${transferRequestId}`, error)
  }
}

const getBody = ({ transferRequestId }: GetBodyParams) => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        Transfer request for review
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        A new transfer request has been submitted for you to review. Please click the button below to start reviewing.
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
        <a href="${process.env.APP_URL}/approvals/${transferRequestId}"
           style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
           Review
        </a>
      </div>
    </td>
  </tr>
  `
}

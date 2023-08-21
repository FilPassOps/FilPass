import { sendEmail } from 'lib/sendEmail'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { baseEmail } from './constants'
import { sendSanctionNotificationValidator } from './validation'
import { logger } from 'lib/logger'

const emailReceiver = process.env.OFAC_SANCTION_EMAIL_RECEIVER || ''

interface SendSanctionNotificationParams {
  userId: number
  sanctionReason: string
}

export async function sendSanctionNotification(params: SendSanctionNotificationParams) {
  const { fields, errors } = await validate(sendSanctionNotificationValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { userId, sanctionReason } = fields

  const emailBody = baseEmail(getBody({ userId, sanctionReason }))

  const receiver = emailReceiver

  if (!receiver) {
    return {
      error: {
        status: 500,
        errors: [errorsMessages.something_went_wrong.message],
      },
    }
  }

  try {
    await sendEmail({
      to: emailReceiver,
      subject: `Flagged user - User ID: ${userId}`,
      html: emailBody,
      text: undefined,
    })
  } catch (error) {
    logger.error(`Failed to notify compliance officer - could not send email. userId:${userId} `, error)
  }
}

const getBody = ({ userId, sanctionReason }: SendSanctionNotificationParams) => {
  return `
    <tr>
        <td style="padding-left:32px; padding-right: 32px; padding-top: 48px ;">
          <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
            Flagged user - User ID: ${userId}
          </h1>

          <p style="margin:0; color: #6B7280;line-height: 24px;">
            This user has been flagged for:
          </p>

          <p style="padding: 16px 10px; margin: 20px 0px; background: #4f46e5; color: white; border-radius: 6px; line-height:24px; font-weight: 500;">
            ${sanctionReason}
          </p>

          <p style="margin:0; color: #6B7280;line-height: 24px;">
            Click the button below to block or unblock the user and their requests:
          </p>

        </td>
    </tr>

    <tr>
      <td align="center" style="padding: 48px 32px 0px 32px;">
        <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;padding-bottom:20px;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
          <a href="${process.env.APP_URL}/flagged-users"
            style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
            Flagged users
          </a>
        </div>
      </td>
    </tr>
    `
}

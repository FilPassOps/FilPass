import { sendEmail } from 'lib/send-email'
import { validate } from 'lib/yup'
import { DateTime } from 'luxon'
import { baseEmail } from './constants'
import { sendCreatedNotificationValidator } from './validation'
import { logger } from 'lib/logger'

interface SendCreatedNotificationParams {
  email: string
  transferRequestId: string
  expectedTransferDate: string
}

interface GetBodyParams {
  expectedTransferDate: string
  transferRequestId: string
}

export async function sendCreatedNotification(params: SendCreatedNotificationParams) {
  const { fields, errors } = await validate(sendCreatedNotificationValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { email, transferRequestId, expectedTransferDate } = fields

  const emailBody = baseEmail(getBody({ expectedTransferDate, transferRequestId }))

  try {
    await sendEmail({
      to: email,
      subject: 'Transfer request created',
      html: emailBody,
    })
  } catch (error) {
    logger.error(`Failed to notify user - could not send email for transferRequestId:${transferRequestId}`, error)
  }
}

const getBody = ({ expectedTransferDate, transferRequestId }: GetBodyParams) => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#034130">
        Transfer request created
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        Your transfer request has been successfully created. The estimated payment date is ${DateTime.fromISO(
          new Date(expectedTransferDate).toISOString(),
        ).toLocaleString(DateTime.DATE_SHORT)}.
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/transfer-requests/${transferRequestId}"
          style="background:#034130;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
          View details
        </a>
      </div>
    </td>
  </tr>
  `
}

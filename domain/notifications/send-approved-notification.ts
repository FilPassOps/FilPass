import { decryptPII } from 'lib/emissary-crypto'
import { sendEmail } from 'lib/send-email'
import { validate } from 'lib/yup'
import { DateTime } from 'luxon'
import { baseEmail } from './constants'
import { sendApprovedNotificationValidator } from './validation'
import { logger } from 'lib/logger'

interface SendApprovedNotificationParams {
  encryptedEmail: string
  transferRequestId: string
  expectedTransferDate: Date
}

interface GetBodyParams {
  expectedTransferDate: string
  transferRequestId: string
}

export async function sendApprovedNotification(params: SendApprovedNotificationParams) {
  const { fields, errors } = await validate(sendApprovedNotificationValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { encryptedEmail, transferRequestId, expectedTransferDate } = fields

  let decryptedEmail

  try {
    decryptedEmail = await decryptPII(encryptedEmail)
  } catch (error) {
    logger.error(`Error decrypting email for transferRequestId:${transferRequestId}`, error)
    return
  }

  const emailBody = baseEmail(getBody({ expectedTransferDate, transferRequestId }))

  try {
    await sendEmail({
      to: decryptedEmail,
      subject: 'Transfer request approved',
      html: emailBody,
    })
    logger.info(`Successfully notified user - sent email for transferRequestId:${transferRequestId}`)
  } catch (error) {
    logger.error(`Failed to notify user - could not send email for transferRequestId:${transferRequestId}`, error)
  }
}

const getBody = ({ expectedTransferDate, transferRequestId }: GetBodyParams) => {
  return `
      <tr>
        <td style="padding-left:32px; padding-right: 32px; padding-top: 48px ;">
          <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#034130">
            Transfer request approved
          </h1>
          <p style="margin:0; color: #6B7280;line-height: 24px;">
            Hello, <br /> <br />
            Your transfer request has been approved and will be paid before ${DateTime.fromISO(
              new Date(expectedTransferDate).toISOString(),
            ).toLocaleString(DateTime.DATE_SHORT)}.
            <br/><br/>
            Our finance team is actively processing your payment. It usually takes one to two weeks for your funds to go out.<br/><br/>
            Please don't hesitate to reach out if you don't see the funds after two weeks.<br/><br/>
            Thank you.
         </p>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding: 48px 32px 0px 32px;">
          <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;padding-bottom:20px;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
             <a href="${process.env.NEXT_PUBLIC_APP_URL}/transfer-requests/${transferRequestId}"
                 style="background:#034130;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
                 View details
             </a>
          </div>
        </td>
      </tr>
    `
}

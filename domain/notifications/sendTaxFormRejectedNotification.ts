import { sendBatchEmail } from 'lib/sendEmail'
import { validate } from 'lib/yup'
import { baseEmail } from './constants'
import { sendTaxFormRejectedNotificationValidator } from './validation'

interface SendTaxFormRejectedNotificationParams {
  emails: string[]
  rejectionReason: string
}

export async function sendTaxFormRejectedNotification(params: SendTaxFormRejectedNotificationParams) {
  const { fields, errors } = await validate(sendTaxFormRejectedNotificationValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { emails, rejectionReason } = fields

  const emailBody = baseEmail(getBody(rejectionReason))

  const content = {
    recipients: emails,
    subject: 'Tax document rejected',
    html: emailBody,
  }

  const fulfilledPromises = await sendBatchEmail(content)
  const rejecteds = fulfilledPromises?.filter(fulfilledPromise => fulfilledPromise.status === 'rejected') as PromiseRejectedResult[]
  rejecteds.forEach(rejected => console.log('failed to notify user - could not send email ', `error:${rejected.reason}`))
}

const getBody = (rejectionReason: string) => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        Tax document rejected
      </h1>

    <p style="margin:0; color: #6B7280;line-height: 24px;">
      Hello, <br /> <br />
      Thanks for submitting your tax document. After careful review, an approver has rejected your tax document for the following reason:
    </p>

    <p style="padding: 16px 10px; margin: 20px 0px; background: #4f46e5; color: white; border-radius: 6px; line-height:24px; font-weight: 500; white-space: pre-line;">${rejectionReason}</p>

    <p style="margin:0; color: #6B7280;line-height: 24px;">
      Click the button below to view more details:
    </p>

    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
        <a href="${process.env.APP_URL}/profile-settings"
           style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
           View details
        </a>
      </div>
    </td>
  </tr>
  `
}

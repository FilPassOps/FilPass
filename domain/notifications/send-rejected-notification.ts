import { sendEmail } from 'lib/send-email'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { baseEmail } from './constants'
import { sendRejectNotificationValidator } from './validation'

interface SendRejectNotificationParams {
  email: string
  notes: string
  transferRequestId: string
}

interface GetBodyParams {
  transferRequestId: string
  notes: string
}

export async function sendRejectedNotification(params: SendRejectNotificationParams) {
  const { fields, errors } = await validate(sendRejectNotificationValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { email, notes, transferRequestId } = fields

  const emailBody = baseEmail(getBody({ transferRequestId, notes }))

  const response = await sendEmail({
    to: email,
    subject: 'Transfer request rejected',
    html: emailBody,
  })

  if (!response) {
    return {
      error: {
        status: 500,
        errors: {
          email: { message: errorsMessages.something_went_wrong.message },
        },
      },
    }
  }

  return {
    data: { message: response.message },
  }
}

const getBody = ({ transferRequestId, notes }: GetBodyParams) => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        Transfer request rejected
      </h1>

      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        Thanks for submitting a transfer request. After careful review, an approver has rejected the transfer request for the following reason:
      </p>

      <p style="padding: 16px 10px; margin: 20px 0px; background: #4f46e5; color: white; border-radius: 6px; line-height:24px; font-weight: 500; white-space: pre-line;">${notes}</p>

      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Click the button below to view more details:
      </p>

    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
        <a href="${process.env.APP_URL}/transfer-requests/${transferRequestId}"
           style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
           View details
       </a>
      </div>
    </td>
  </tr>
  `
}

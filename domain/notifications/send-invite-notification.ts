import { AppConfig } from 'config'
import { sendEmail } from 'lib/send-email'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { baseEmail } from './constants'
import { sendInviteValidator } from './validation'

interface SendInviteNotificationParams {
  email: string
  inviterEmail: string
}

interface GetBodyParams {
  inviterEmail: string
}

export async function sendInviteNotification(params: SendInviteNotificationParams) {
  const { fields, errors } = await validate(sendInviteValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { email, inviterEmail } = fields

  const emailBody = baseEmail(getBody({ inviterEmail }))

  const response = await sendEmail({
    to: email,
    subject: `You were invited to join ${AppConfig.app.name}`,
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

const getBody = ({ inviterEmail }: GetBodyParams) => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        You were invited to join ${AppConfig.app.name}
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        ${inviterEmail} has invited you to join ${AppConfig.app.name}. Please click the button below to create your account.
      </p>
    </td>
  </tr>

<tr>
  <td align="center" style="padding: 48px 32px 0px 32px;">
    <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
       <a href="${process.env.APP_URL}/signup?from=invite-email"
          style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
          Create account
       </a>
    </div>
  </td>
</tr>
  `
}

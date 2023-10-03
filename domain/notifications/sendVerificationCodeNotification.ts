import { sendEmail } from 'lib/sendEmail'
import { validate } from 'lib/yup'
import { AppConfig } from 'system.config'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { baseEmail } from './constants'
import { sendVerificationCodeValidator } from './validation'

interface SendVerificationCodeNotificationParams {
  email: string
  code: string
}

interface GetBodyParams {
  code: string
}

export async function sendVerificationCodeNotification(params: SendVerificationCodeNotificationParams) {
  const { fields, errors } = await validate(sendVerificationCodeValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { email, code } = fields

  const emailBody = baseEmail(getBody({ code }))

  const response = await sendEmail({
    to: email,
    subject: `${AppConfig.app.name} security code`,
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

const getBody = ({ code }: GetBodyParams) => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        ${AppConfig.app.name} security code
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        Please use the verification code below to log in.
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:20px;line-height:24px;font-weight: 800;">
        <p style="background:#4F46E5;padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;letter-spacing: 5px;">
           ${code}
        </p>
      </div>
    </td>
  </tr>

  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Your code will expire in 10 minutes. <br /> <br />
        If you did not attempt to log in, we recommend changing your password on ${AppConfig.app.name} using the Forgot Password link on the login page.
      </p>
    </td>
  </tr>
  `
}

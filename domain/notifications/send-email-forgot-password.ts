import { sendEmail } from 'lib/send-email'
import jwt from 'jsonwebtoken'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { validate } from 'lib/yup'
import { sendEmailForgotPasswordValidator } from './validation'
import { baseEmail } from './constants'

interface SendEmailForgotPasswordParams {
  email: string
}

interface GetBodyParams {
  token: string
}

export async function sendEmailForgotPassword(params: SendEmailForgotPasswordParams) {
  const { fields, errors } = await validate(sendEmailForgotPasswordValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { email } = fields

  const secret = process.env.APP_SECRET

  if (!secret) {
    return {
      error: {
        status: 500,
        errors: [errorsMessages.something_went_wrong.message],
      },
    }
  }

  const token = jwt.sign({ email }, secret, {
    expiresIn: '1h',
  })

  const emailBody = baseEmail(getBody({ token }))

  const response = await sendEmail({
    to: email,
    subject: 'Forgot your password?',
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

const getBody = ({ token }: GetBodyParams) => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#065F59">
        Forgot your password?
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        There was a request to change your password. <br />
        Please ignore this email if you did not make this request. <br />
        Otherwise, please click the button below to change your password.
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/?token=${token}"
          style="background:#047870;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
          Change password
        </a>
      </div>
    </td>
  </tr>
  `
}

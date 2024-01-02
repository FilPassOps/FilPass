import { AppConfig } from 'config'
import jwt from 'jsonwebtoken'
import { sendEmail } from 'lib/send-email'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { baseEmail } from './constants'
import { sendEmailVerificationValidator } from './validation'

interface SendEmailVerificationParams {
  email: string
}

interface GetBodyParams {
  token: string
}

export async function sendEmailVerification(params: SendEmailVerificationParams) {
  const { fields, errors } = await validate(sendEmailVerificationValidator, params)

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
    subject: `Activate your ${AppConfig.app.name} account`,
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
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        Activate your ${AppConfig.app.name} account
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        Please click the button below to activate your ${AppConfig.app.name} account.
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
       <a href="${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${token}"
          style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
          Activate account
       </a>
      </div>
    </td>
  </tr>
  `
}

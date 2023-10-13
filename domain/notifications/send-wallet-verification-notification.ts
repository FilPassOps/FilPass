import jwt from 'jsonwebtoken'
import { sendEmail } from 'lib/send-email'
import { validate } from 'lib/yup'
import { baseEmail } from './constants'
import { sendWalletVerificationNotificationValidator } from './validation'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface SendWalletVerificationNotificationParams {
  email: string
  address: string
  id: number
  userId: number
}

interface GetBodyParams {
  token: string
}

export async function sendWalletVerificationNotification(params: SendWalletVerificationNotificationParams) {
  const { fields, errors } = await validate(sendWalletVerificationNotificationValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const secret = process.env.APP_SECRET

  if (!secret) {
    return {
      error: {
        status: 500,
        errors: [errorsMessages.something_went_wrong.message],
      },
    }
  }

  const { email, address, id, userId } = fields

  const token = jwt.sign({ email, address, id, userId }, secret, {
    expiresIn: '48h',
  })

  const emailBody = baseEmail(getBody({ token }))

  return sendEmail({
    to: email,
    subject: 'Activate your new wallet',
    html: emailBody,
  })
}

const getBody = ({ token }: GetBodyParams) => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        Activate your new wallet
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Please click the button below to activate your wallet.
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
        <a href="${process.env.APP_URL}/wallet-activate?token=${token}"
           style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
           Activate wallet
        </a>
      </div>
    </td>
  </tr>

  <tr>
    <td style="padding: 48px 32px 0px 32px;">
        <p style="margin:0; color: #6B7280;line-height: 24px;">
          If you are having trouble clicking the button above, copy and paste the URL below into your web browser.<br /><br />
        </p>
        <p style="margin:0; line-height: 24px; font-size:12px; word-break: break-all;">
          ${process.env.APP_URL}/wallet-activate?token=${token}
        </p>
    </td>
  </tr>
  `
}

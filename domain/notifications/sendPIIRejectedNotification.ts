import { sendEmail } from 'lib/sendEmail'
import { validate } from 'lib/yup'
import { baseEmail } from './constants'
import { sendEmailVerificationValidator } from './validation'
import { PLATFORM_NAME } from 'system.config'

interface SendPIIRejectedNotificationParams {
  email: string
}

export async function sendPIIRejectedNotification(params: SendPIIRejectedNotificationParams) {
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

  const emailBody = baseEmail(getBody())

  const content = {
    to: email,
    subject: `Not allowed to use ${PLATFORM_NAME}`,
    html: emailBody,
    text: undefined,
  }

  try {
    await sendEmail(content)
  } catch (error) {
    console.log('failed to notify user - could not send email ', `user email:${email} `, `error:${error}`)
  }
}

const getBody = () => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        Not allowed to use ${PLATFORM_NAME}
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        Thanks for signing up for ${PLATFORM_NAME}. After careful review, you are not allowed to use ${PLATFORM_NAME}. <br /><br />
      </p>
    </td>
  </tr>
  `
}

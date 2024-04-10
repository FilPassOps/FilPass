import { decryptPII } from 'lib/emissary-crypto'
import prisma from 'lib/prisma'
import { sendBatchEmail } from 'lib/send-email'
import { validate } from 'lib/yup'
import { baseEmail } from './constants'
import { sendBatchPaidNotificationValidator } from './validation'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface SendBatchPaidNotificationParams {
  publicIds: string[]
}

interface EmailReminderRecipient {
  email: string
}

export async function sendBatchPaidNotification(params: SendBatchPaidNotificationParams) {
  const { fields, errors } = await validate(sendBatchPaidNotificationValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const recipients: EmailReminderRecipient[] = []

  const { publicIds } = fields

  try {
    const transferRequests = await prisma.transferRequest.findMany({
      where: { publicId: { in: publicIds } },
      include: {
        receiver: true,
        program: true,
      },
    })

    const recipientsResult = await Promise.allSettled(
      transferRequests.map(async transferRequest => {
        const email: string = await decryptPII(transferRequest.receiver.email)
        return {
          email,
        }
      }),
    )

    recipientsResult.forEach(item => {
      if (item.status === 'fulfilled') return recipients.push(item.value)
    })
  } catch (error) {
    console.error(error)
    return {
      error: {
        status: 400,
        errors: errorsMessages.something_went_wrong,
      },
    }
  }

  await sendBatchEmail({
    recipients,
    subject: `You have new paid transfer request(s)`,
    html: baseEmail(getBody()),
  })
}

const getBody = () => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#034130">
      You have new paid transfer request(s)
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        You have new paid transfer request(s) 🎉
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-transfer-requests?status=PAID"
           style="background:#034130;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
           View details
        </a>
      </div>
    </td>
  </tr>
  `
}

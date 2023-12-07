import { baseEmail } from 'domain/notifications/constants'
import { REQUIRES_CHANGES_STATUS } from 'domain/transfer-request/constants'
import { decryptPII } from 'lib/emissary-crypto'
import { logger } from 'lib/logger'
import prisma from 'lib/prisma'
import { sendBatchEmail } from 'lib/send-email'

interface EmailReminderRecipient {
  email: string
}

export default async function run() {
  const thirdyDaysAgo = new Date()
  thirdyDaysAgo.setDate(thirdyDaysAgo.getDate() - 30)

  const thirdyDaysAgoInit = new Date(thirdyDaysAgo)
  thirdyDaysAgoInit.setHours(0, 0, 0, 0)

  const thirdyDaysAgoEnd = new Date(thirdyDaysAgo)
  thirdyDaysAgoEnd.setHours(23, 59, 59, 59)

  const transferRequests = await prisma.transferRequest.findMany({
    distinct: ['receiverId'],
    select: {
      id: true,
      receiver: {
        select: {
          email: true,
        },
      },
    },
    where: {
      status: REQUIRES_CHANGES_STATUS,
      history: {
        some: {
          createdAt: {
            gte: thirdyDaysAgoInit,
            lte: thirdyDaysAgoEnd,
          },
          newValue: REQUIRES_CHANGES_STATUS,
        },
      },
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

  const recipients: EmailReminderRecipient[] = []

  recipientsResult.forEach(item => {
    if (item.status === 'fulfilled') return recipients.push(item.value)
  })

  try {
    await sendBatchEmail({ recipients, subject: 'Transfer Request pending action', html: baseEmail(getBody()) })
  } catch (e) {
    logger.error('Something went wrong during the batch email sent', e)
    return
  }

  return recipients
}

const getBody = () => {
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        Transfer Request pending action
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        A transfer request needs your attention. Please click the button below
        to view more details and make the requested change.
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-transfer-requests?status=REQUIRES_CHANGES"
           style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
           View details
        </a>
      </div>
    </td>
  </tr>
  `
}

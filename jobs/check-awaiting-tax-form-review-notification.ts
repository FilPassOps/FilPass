import { baseEmail } from 'domain/notifications/constants'
import { decryptPII } from 'lib/emissaryCrypto'
import prisma from 'lib/prisma'
import { sendBatchEmail } from 'lib/sendEmail'

interface EmailReminderRecipient {
  email: string
}

export default async function run() {
  const awaitingReviewTaxCount = await prisma.userFile.count({
    where: {
      type: {
        in: ['W8_FORM', 'W9_FORM'],
      },
      isApproved: {
        equals: null,
      },
      isActive: true,
    },
  })

  if (awaitingReviewTaxCount < 1) {
    return
  }

  const financeUsers = await prisma.userRole.findMany({
    where: {
      role: {
        equals: 'FINANCE',
      },
      isActive: true,
      user: {
        isActive: true,
      },
    },
    select: {
      user: {
        select: {
          email: true,
        },
      },
    },
  })

  if (financeUsers.length < 1) {
    return
  }

  const recipients: EmailReminderRecipient[] = []

  const recipientsResult = await Promise.allSettled(
    financeUsers.map(async userRole => {
      const email: string = await decryptPII(userRole.user.email)
      return {
        email,
      }
    })
  )

  recipientsResult.forEach(item => {
    if (item.status === 'fulfilled') return recipients.push(item.value)
  })

  await sendBatchEmail({
    recipients,
    subject: `There ${awaitingReviewTaxCount > 1 ? 'are tax forms' : 'is a tax form'} waiting for your review`,
    html: baseEmail(getBody(awaitingReviewTaxCount)),
  })
}

const getBody = (awaitingReviewTaxCount: number) => {
  const isPlural = awaitingReviewTaxCount > 1
  // prettier-ignore
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        There ${isPlural ? 'are tax forms' : 'is tax form'} waiting for your review
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        There ${isPlural ? 'are': 'is'} ${awaitingReviewTaxCount} submitted tax ${isPlural ? 'forms': 'form'} waiting for your review. Please click the button below to start reviewing.
      </p>
    </td>
  </tr>

  <tr>
    <td align="center" style="padding: 48px 32px 0px 32px;">
      <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
        <a href="${process.env.APP_URL}/tax-review?status=UNREVIEWED"
           style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
           Review tax forms
        </a>
      </div>
    </td>
  </tr>
  `
}

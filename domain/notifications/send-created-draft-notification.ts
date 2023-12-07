import { AppConfig } from 'config'
import { USD } from 'domain/currency/constants'
import { formatCrypto, formatCurrency } from 'lib/currency'
import { logger } from 'lib/logger'
import { sendEmail } from 'lib/send-email'
import { validate } from 'lib/yup'
import { baseEmail } from './constants'
import { sendCreatedDrafNotificationValidator } from './validation'

interface ProgramCurrency {
  type: string
  currency: {
    name: string
  }
}

interface SendCreatedDraftNotificationParams {
  hasAccount: boolean
  email: string
  transferRequestId: string
  amount: string
  programCurrency: ProgramCurrency[]
}

interface GetBodyParams {
  hasAccount: boolean
  formattedAmount: string
  transferRequestId: string
}

interface GetFormattedAmountParams {
  amount?: string
  programCurrency?: ProgramCurrency[]
}

export async function sendCreatedDraftNotification(params: SendCreatedDraftNotificationParams) {
  const { fields, errors } = await validate(sendCreatedDrafNotificationValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { hasAccount, email, transferRequestId, amount, programCurrency } = fields

  const formattedAmount = getFormattedAmount({ amount, programCurrency })

  const emailBody = baseEmail(getBody({ hasAccount, formattedAmount, transferRequestId }))

  try {
    await sendEmail({
      to: email,
      subject: `${AppConfig.app.name} wants to pay you`,
      html: emailBody,
    })
  } catch (error) {
    logger.error(`Failed to notify user - could not send email for transferRequestId:${transferRequestId}`, error)
  }
}

const getBody = ({ hasAccount, formattedAmount, transferRequestId }: GetBodyParams) => {
  if (hasAccount) {
    return `
      <tr>
        <td style="padding-left:32px; padding-right: 32px; padding-top: 48px;">
          <h1
              style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5;">
              ${AppConfig.app.name} wants to pay you
          </h1>
          <p style="margin:0; color: #6B7280;line-height: 24px;">
            Hello, <br /> <br />
            There is a ${formattedAmount} transfer request waiting for you. <br />
            Please complete the request.
         </p>
          </td>
      </tr>
      <tr>
        <td align="center" style="padding: 48px 32px 0px 32px;">
          <div
              style="display:inline-block;width:100%;max-width:400px;vertical-align:top;padding-bottom:20px;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
             <a href="${process.env.NEXT_PUBLIC_APP_URL}/transfer-requests/${transferRequestId}/edit"
                 style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
                 View details
             </a>
          </div>
        </td>
      </tr>
    `
  } else {
    return `
    <tr>
      <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
        <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5;">
          ${AppConfig.app.name} wants to pay you
        </h1>
        <p style="margin:0; color: #6B7280;line-height: 24px;">
          Hello, <br /> <br />
          There is a ${formattedAmount} transfer request waiting for you. <br />
          Please create a ${AppConfig.app.name} account and complete the request.
        </p>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding: 48px 32px 0px 32px;">
        <div style="display:inline-block;width:100%;max-width:400px;vertical-align:top;font-family:Inter,sans-serif;font-size:16px;line-height:24px;font-weight: 500;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/signup?from=draft-email&id=${transferRequestId}"
            style="background:#4F46E5;text-decoration: none; padding: 13px 33px; color: #ffffff; border-radius: 6px; display:inline-block;">
            Create account
          </a>
        </div>
      </td>
    </tr>
    `
  }
}

const getFormattedAmount = ({ amount, programCurrency }: GetFormattedAmountParams) => {
  if (!amount || parseFloat(amount) === 0) return ''
  if (!programCurrency || programCurrency.length === 0) return ''

  const {
    currency: { name: requestCurrencyName },
  } = programCurrency.find(({ type }) => type === 'REQUEST') as ProgramCurrency
  const {
    currency: { name: paymentCurrencyName },
  } = programCurrency.find(({ type }) => type === 'PAYMENT') as ProgramCurrency

  if (requestCurrencyName === USD) return `${formatCurrency(amount)} in ${paymentCurrencyName}`
  return `${formatCrypto(amount)} ${paymentCurrencyName}`
}

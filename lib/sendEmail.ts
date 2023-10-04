import FormData from 'form-data'
import { chunk } from 'lodash'
import Mailgun from 'mailgun.js'
import { AppConfig } from 'system.config'

const apiKey = process.env.MAILGUN_API_KEY || ''
const domain = process.env.MAILGUN_DOMAIN || ''
const senderEmail = process.env.MAILGUN_SENDER_EMAIL || ''

//https://github.com/mailgun/mailgun.js/issues/364
//@ts-ignore
const mailgun = new Mailgun(FormData)
const client = mailgun.client({ username: 'api', key: apiKey })

interface SendEmailProps {
  to: string
  subject: string
  text?: string
  html?: string
}

export const sendEmail = async ({ to, subject, text = '', html = '' }: SendEmailProps) => {
  return client.messages.create(domain, {
    to,
    from: `${AppConfig.app.emailConfig.fromName} <${senderEmail}>`,
    subject,
    text,
    html,
  })
}

interface SendBatchEmailProps {
  recipients: any[]
  subject: string
  text?: string
  html?: string
}

export const sendBatchEmail = async ({ recipients, subject, text = '', html = '' }: SendBatchEmailProps) => {
  if (!recipients || !recipients.length) return null

  const recipientChunks = chunk(recipients, 1000)
  const sendEmailPromisses = recipientChunks.map(recipient => {
    const emails = recipient.map(item => (item.email ? item.email : item))
    const variables = JSON.stringify(
      recipient.reduce((a, v, idx) => ({ ...a, [v.email || v]: { recipientId: idx + 1, ...v.variables } }), {}),
    )

    return client.messages.create(domain, {
      to: emails,
      from: `${AppConfig.app.emailConfig.fromName} <${senderEmail}>`,
      subject,
      text,
      html: html,
      'recipient-variables': variables,
    })
  })
  return Promise.allSettled(sendEmailPromisses)
}

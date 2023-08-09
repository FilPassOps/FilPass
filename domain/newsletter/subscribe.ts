import { encryptPII } from 'lib/emissaryCrypto'
import { generateEmailHash } from 'lib/password'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { subscribeNewsletterValidator } from './validation'

interface SubscribeToNewsletterProps {
  email: string
}

interface SubscribeToNewsletterResponse {
  data?: {
    email: string
    success: boolean
  }
  error?: {
    status: number
    message?: string
    errors?: any
  }
}

export const subscribeToNewsletter = async (props: SubscribeToNewsletterProps): Promise<SubscribeToNewsletterResponse> => {
  try {
    const { fields, errors } = await validate(subscribeNewsletterValidator, props)

    const { email } = fields as SubscribeToNewsletterProps

    if (errors || !fields) {
      return {
        error: {
          status: 400,
          errors,
        },
      }
    }

    const encryptedEmail = await encryptPII(email)
    const emailHash = await generateEmailHash(email)

    const result = await prisma.newsletterSubscriber.upsert({
      where: {
        emailHash: emailHash,
      },
      create: {
        email: encryptedEmail,
        emailHash: emailHash,
      },
      update: {
        updatedAt: new Date(),
      },
    })

    return {
      data: {
        email: result.email,
        success: true,
      },
    }
  } catch (error) {
    return {
      error: {
        status: 500,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }
}

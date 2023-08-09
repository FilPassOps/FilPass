import { updateUserById, updateUserOnHoldTranferRequests, updateUserTaxInfoById } from 'domain/user'
import { onboardingValidator, personalInformationCheckValidator, taxFormValidator, termsValidator } from 'domain/user/validation'
import { newHandler, NextApiHandlerWithUser, NextApiRequestWithSession, withMethods, withUser } from 'lib/middleware'
import prisma from 'lib/prisma'
import yup, { validate } from 'lib/yup'
import { DateTime } from 'luxon'

export interface UpdateUserRequest {
  pii?: yup.Asserts<typeof personalInformationCheckValidator>
  taxForm?: yup.Asserts<typeof taxFormValidator>
  terms?: yup.Asserts<typeof termsValidator>
  isOnboarded?: boolean
}

export interface UpdateUserResponse {
  isSanctioned: boolean
  isOnboarded: boolean
  piiUpdatedAt: Date
}

interface ExtendedRequest extends NextApiRequestWithSession {
  body: UpdateUserRequest
}

const handler: NextApiHandlerWithUser<UpdateUserResponse | unknown, ExtendedRequest> = async ({ user, body }, res) => {
  if (!user) {
    return res.status(403).send({ message: 'Forbidden' })
  }

  const { errors, fields } = await validate(onboardingValidator, body)

  if (errors || !fields) {
    return res.status(400).json(errors)
  }

  const { taxForm, pii, terms, isOnboarded } = fields

  const { piiUpdatedAt } = (await prisma.user.findUnique({
    select: {
      piiUpdatedAt: true,
    },
    where: {
      id: user.id,
    },
  })) as { piiUpdatedAt: Date | null }

  if (pii && piiUpdatedAt && Math.ceil(DateTime.fromJSDate(piiUpdatedAt).diffNow('days').days * -1) < 30) {
    return res.status(412).send({ message: 'You can only change this information once every 30 days' })
  }

  if (taxForm) {
    await updateUserTaxInfoById(user.id, taxForm)
  }

  const mountPii = pii && { ...pii, email: user.email }

  const result = await updateUserById(user.id, { pii: mountPii, terms, isOnboarded })

  await updateUserOnHoldTranferRequests({
    userId: user.id,
    isSanctioned: result.isSanctioned ?? true,
    sanctionReason: result.sanctionReason,
  })

  return res.status(200).json(result)
}

export default newHandler(withUser(withMethods(['POST'], handler)))

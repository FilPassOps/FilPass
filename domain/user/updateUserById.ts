import { sendSanctionNotification } from 'domain/notifications/sendSanctionNotification'
import { encryptPII } from 'lib/emissaryCrypto'
import { SanctionCheckResult, checkSanction } from 'lib/emissarySanctionCheck'
import prisma from 'lib/prisma'
import yup from 'lib/yup'
import { DateTime } from 'luxon'
import { personalInformationCheckValidator, termsValidator } from './validation'

interface PiiType extends yup.Asserts<typeof personalInformationCheckValidator> {
  email: string
}

interface Data {
  pii?: PiiType | null
  terms?: yup.Asserts<typeof termsValidator> | null
  isOnboarded?: boolean
}

interface MountPiiProps {
  pii: PiiType
  checkSanctionResult?: SanctionCheckResult
}

async function mountPii({ pii, checkSanctionResult }: MountPiiProps) {
  const { firstName, lastName, dateOfBirth, countryResidence } = pii
  const dobIsoDate = DateTime.fromJSDate(dateOfBirth).toUTC().toISODate()

  return {
    firstName: await encryptPII(firstName),
    lastName: await encryptPII(lastName),
    dateOfBirth: dobIsoDate ? await encryptPII(dobIsoDate) : null,
    countryResidence: await encryptPII(countryResidence),
    isSanctioned: checkSanctionResult?.isSanctioned,
    sanctionReason: checkSanctionResult?.sanctionReason ? await encryptPII(checkSanctionResult.sanctionReason) : null,
    isReviewedByCompliance: checkSanctionResult?.isSanctioned ? false : undefined,
    piiUpdatedAt: new Date(),
  }
}

export async function updateUserById(userId: number, data: Data) {
  const { pii, terms, isOnboarded } = data

  const checkSanctionResult = pii ? await checkSanction(pii) : undefined
  const mountedPii = pii ? await mountPii({ pii, checkSanctionResult }) : undefined

  const result = await prisma.user.update({
    select: {
      isSanctioned: true,
      isOnboarded: true,
      piiUpdatedAt: true,
      sanctionReason: true,
    },
    where: {
      id: userId,
    },
    data: {
      ...mountedPii,
      terms: terms ? terms : undefined,
      isOnboarded,
    },
  })

  if (checkSanctionResult?.isSanctioned && checkSanctionResult?.sanctionReason) {
    await sendSanctionNotification({ userId, sanctionReason: checkSanctionResult.sanctionReason })
  }

  return result
}

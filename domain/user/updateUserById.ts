import { encryptPII } from 'lib/emissaryCrypto'
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
}

async function mountPii({ pii }: MountPiiProps) {
  const { firstName, lastName, dateOfBirth, countryResidence } = pii
  const dobIsoDate = DateTime.fromJSDate(dateOfBirth).toUTC().toISODate()

  return {
    firstName: await encryptPII(firstName),
    lastName: await encryptPII(lastName),
    dateOfBirth: dobIsoDate ? await encryptPII(dobIsoDate) : null,
    countryResidence: await encryptPII(countryResidence),
    piiUpdatedAt: new Date(),
  }
}

export async function updateUserById(userId: number, data: Data) {
  const { pii, terms, isOnboarded } = data

  const mountedPii = pii ? await mountPii({ pii }) : undefined

  const result = await prisma.user.update({
    select: {
      isOnboarded: true,
      piiUpdatedAt: true,
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

  return result
}

import prisma from 'lib/prisma'
import yup from 'lib/yup'
import { termsValidator } from './validation'

interface Data {
  terms?: yup.Asserts<typeof termsValidator> | null
  isOnboarded?: boolean
}

export async function updateUserById(userId: number, data: Data) {
  const { terms, isOnboarded } = data

  const result = await prisma.user.update({
    select: {
      isOnboarded: true,
    },
    where: {
      id: userId,
    },
    data: {
      terms: terms ? terms : undefined,
      isOnboarded,
    },
  })

  return result
}

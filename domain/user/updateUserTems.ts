import { PrismaClient } from '@prisma/client'
import { getPrismaClient } from 'lib/prisma'
import yup from 'lib/yup'
import { termsValidator } from './validation'

interface Data {
  terms: yup.Asserts<typeof termsValidator>
}

export async function updateUserTerms(userId: number, { terms }: Data) {
  const prisma: PrismaClient = await getPrismaClient()
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      piiUpdatedAt: new Date(),
      terms,
    },
  })

  return terms
}

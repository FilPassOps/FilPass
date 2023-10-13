import prisma from 'lib/prisma'
import yup from 'lib/yup'
import { termsValidator } from './validation'

interface Data {
  terms: yup.Asserts<typeof termsValidator>
}

export async function updateUserTerms(userId: number, { terms }: Data) {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      terms,
    },
  })

  return terms
}

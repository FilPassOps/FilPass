import prisma from 'lib/prisma'
import { generateEmailHash } from 'lib/password'

export const getUserByEmail = async (email: string) => {
  if (!email) {
    throw new Error('Email is required')
  }

  const emailHash = await generateEmailHash(email)
  const user = await prisma.user.findFirst({ where: { emailHash } })
  return user
}

import { Role } from '@prisma/client'
import { encryptPII } from 'lib/crypto'
import { generateEmailHash } from 'lib/password'
import prisma from 'lib/prisma'

interface SigninWithGoogleParams {
  email: string
}

export async function signinWithGoogle({ email }: SigninWithGoogleParams) {
  const userFound = await prisma.user.findFirst({ where: { isActive: true, emailHash: await generateEmailHash(email) } })

  let user
  if (userFound) {
    user = await prisma.user.update({
      where: { id: userFound.id },
      data: {
        email: (await encryptPII(email)) || undefined,
        emailHash: await generateEmailHash(email),
        terms: true,
      },
      include: {
        roles: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    })
  } else {
    user = await prisma.user.create({
      data: {
        email: await encryptPII(email),
        emailHash: await generateEmailHash(email),
        isVerified: true,
        terms: true,
        roles: {
          createMany: {
            data: [{ role: Role.USER }],
          },
        },
      },
      include: {
        roles: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    })
  }

  return {
    data: {
      id: user.id,
      email,
      roles: user.roles,
    },
  }
}

import { PrismaClient } from '@prisma/client'
import { Countries } from 'domain/transferRequest/countries'
import { getPrismaClient } from 'lib/prisma'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface FindAllSanctionedParams {
  isSanctioned: boolean
  isReviewedByCompliance: boolean
  page: number
  pageSize: number
}

export async function findAllSanctioned({ isReviewedByCompliance, isSanctioned, page, pageSize }: FindAllSanctionedParams) {
  const prisma: PrismaClient = await getPrismaClient()

  const users = await prisma.user.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    where: {
      isSanctioned,
      isReviewedByCompliance,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      countryResidence: true,
      wallets: {
        select: {
          address: true,
          verification: true,
          blockchain: {
            select: {
              name: true,
            },
          },
        },
        where: {
          isActive: true,
          isDefault: true,
        },
      },
      sanctionReason: true,
    },
  })

  const totalItems = await prisma.user.count({
    where: {
      isSanctioned,
      isReviewedByCompliance,
      isActive: true,
    },
  })

  if (!users) {
    return {
      error: {
        status: 404,
        errors: {
          users: {
            message: `Users ${errorsMessages.not_found}`,
          },
        },
      },
    }
  }

  const formattedUsers = users.map(user => {
    return {
      ...user,
      countryResidence: Countries.find(country => country.value === user.countryResidence)?.label,
    }
  })

  return { data: { users: formattedUsers, totalItems } }
}

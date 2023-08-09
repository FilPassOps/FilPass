import { Countries } from 'domain/transferRequest/countries'
import prisma from 'lib/prisma'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface FindAllPIIParams {
  page: number
  pageSize: number
}

export async function findAllPII({ page, pageSize }: FindAllPIIParams) {
  const users = await prisma.user.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    where: {
      isActive: true,
      NOT: [{ firstName: null }, { lastName: null }],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      countryResidence: true,
      isSanctioned: true,
      isReviewedByCompliance: true,
      sanctionReason: true,
      wallets: {
        select: {
          address: true,
          verification: true,
        },
        where: {
          isActive: true,
          isDefault: true,
        },
      },
    },
  })

  const totalItems = await prisma.user.count({
    where: {
      isActive: true,
      NOT: [{ firstName: null }, { lastName: null }],
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

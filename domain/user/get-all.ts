import { Prisma as PrismaClient } from '@prisma/client'
import { decryptPII } from 'lib/emissary-crypto'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { findAllValidator } from './validation'

interface FindAllUsersParams {
  size?: number
  page?: number
  sort?: string
  order?: string
}

interface GetSortParams {
  sort?: string
  order?: string
}

export async function getAllUsers(params: FindAllUsersParams) {
  const { errors } = await validate(findAllValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { sortType, orderBy } = getSortParams(params)
  const { size = 100, page = 1 } = params

  const currentPage = page - 1 < 0 ? 0 : page - 1
  const pagination = PrismaClient.sql` LIMIT ${Number(size)} OFFSET ${size * currentPage}`

  const activeUsersTotal = await prisma.user.count({
    where: {
      isActive: true,
    },
  })

  const users = await prisma.$queryRaw`
    SELECT
      u.id                           id,
      u.email                        email,
      u.created_at                   created_at,
      u.is_banned                    is_banned,
      u.ban_reason                   ban_reason,
      JSON_AGG(distinct ur."role")   roles
    FROM "user" u
    INNER JOIN user_role ur ON ur.user_id = u.id AND ur.is_active = true
    WHERE u.is_active = true
    GROUP BY u.id
    ${sortType} ${orderBy}
    ${pagination}
  `

  if (!users) {
    return {
      error: {
        status: 404,
        errors: {
          programs: {
            message: `Users ${errorsMessages.not_found}`,
          },
        },
      },
    }
  }

  const decrypted = (users as any[]).map(async (data: any) => ({
    ...data,
    email: await decryptPII(data.email),
  }))

  const data = await Promise.all(decrypted)

  return { data: { users: data, totalItems: activeUsersTotal } }
}

const getSortParams = ({ order }: GetSortParams) => {
  const sortTypes = {
    create_date: PrismaClient.sql`ORDER BY u.created_at`,
  }

  const orderTypes = {
    desc: PrismaClient.sql`DESC`,
    asc: PrismaClient.sql`ASC`,
  }

  const sortType = sortTypes.create_date
  const orderBy = order === 'desc' ? orderTypes[order] : orderTypes.asc
  return { sortType, orderBy }
}

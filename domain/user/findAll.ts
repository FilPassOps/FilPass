import { Prisma as PrismaClient } from '@prisma/client'
import { decryptPII } from 'lib/emissaryCrypto'
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

export async function findAllUsers(params: FindAllUsersParams) {
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
      isActive: true
    }
  })

  const users = await prisma.$queryRaw`
    SELECT
      u.id                           id,
      u.email                        email,
      u.created_at                   created_at,
      u.is_banned                    is_banned,
      u.ban_reason                   ban_reason,
      COUNT(p.id)::integer           programs_assigned,
      JSON_AGG(distinct ur."role")   roles,
      JSON_STRIP_NULLS(
        JSON_AGG(
           JSON_BUILD_OBJECT(
            'id',              p.id,
            'name',            p.name,
            'request_unit',    request_unit."name",
            'payment_unit',    payment_unit."name",
            'delivery_method', p.delivery_method
           )
        )
      ) as approver_programs
    FROM "user" u
    INNER JOIN user_role ur ON ur.user_id = u.id AND ur.is_active = true
    LEFT JOIN user_role_program urp ON urp.user_role_id = ur.id AND urp.is_active = true
    LEFT JOIN "program" p ON p.id = urp.program_id AND p.is_active = true AND p.is_archived = false
    LEFT JOIN program_currency AS program_currency_request ON program_currency_request.program_id = p.id and program_currency_request."type"::text = 'REQUEST'
    LEFT JOIN currency_unit AS request_unit ON program_currency_request.currency_unit_id = request_unit.id
    LEFT JOIN program_currency AS program_currency_payment ON program_currency_payment.program_id = p.id and program_currency_payment."type"::text = 'PAYMENT'
    LEFT JOIN currency_unit AS payment_unit  ON program_currency_payment.currency_unit_id = payment_unit.id
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

const getSortParams = ({ sort, order }: GetSortParams) => {
  const sortTypes = {
    create_date: PrismaClient.sql`ORDER BY u.created_at`,
    programs_assigned: PrismaClient.sql`ORDER BY programs_assigned`,
  }

  const orderTypes = {
    desc: PrismaClient.sql`DESC`,
    asc: PrismaClient.sql`ASC`,
  }

  const sortType = sort === 'programs_assigned' ? sortTypes[sort] : sortTypes.create_date
  const orderBy = order === 'desc' ? orderTypes[order] : orderTypes.asc
  return { sortType, orderBy }
}

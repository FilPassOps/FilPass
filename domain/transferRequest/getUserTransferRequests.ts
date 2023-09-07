import { Prisma } from '@prisma/client'
import { statusFilterMapping } from 'components/Filters/constants'
import { decrypt, decryptPII } from 'lib/emissaryCrypto'
import { generateTeamHash } from 'lib/password'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'

import { DRAFT_STATUS } from './constants'
import { getUserTransferRequestsValidator } from './validation'

interface GetUserTransferRequestsParams {
  userId?: number
  programIds?: number[]
  requestNumber?: string
  status?: string
  team?: string[]
  from?: Date
  to?: Date
  wallets?: string[]
  page?: number
  size?: number
  sort?: string
  order?: string
}

interface Request {
  id: string
  status: string
  team: string
  create_date: Date
  amount: string
  vesting_start_epoch: number
  vesting_months: number
  program_name: string
  receiver: string
  applyer: string
  notes: string
  transfer_hash: string
  request_unit: string
  payment_unit: string
  user_wallet_address: string
  user_wallet_blockchain: string
  user_wallet_is_verified: boolean
}

export async function getUserTransferRequests(params: GetUserTransferRequestsParams) {
  const { fields, errors } = await validate(getUserTransferRequestsValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { userId, size = 100, page = 1, sort, order, programIds, requestNumber, status, team, from, to, wallets } = fields

  const currentPage = page - 1
  const pagination = Prisma.sql` LIMIT ${size} OFFSET ${size * currentPage}`
  const { sortType, orderBy } = getSortParams({ sort, order })
  const teamHashes = team ? await Promise.all(team.map(team => generateTeamHash(team))) : undefined

  const programFilter =
    programIds && programIds.length ? Prisma.sql`AND  filter.request_program_id IN (${Prisma.join(programIds)})` : Prisma.empty
  const numberFilter = requestNumber ? Prisma.sql`AND filter.id = ${requestNumber}` : Prisma.empty
  const teamFilter = teamHashes ? Prisma.sql`AND filter.team_hash IN (${Prisma.join(teamHashes)})` : Prisma.empty
  const walletFilter = wallets?.length ? Prisma.sql`AND filter.request_user_wallet_address IN (${Prisma.join(wallets)})` : Prisma.empty
  const createDateFilter = from && to ? Prisma.sql`AND filter.create_date BETWEEN ${from} AND ${to}` : Prisma.empty

  let statusFilter = Prisma.empty

  const requestCount = Prisma.sql`
    SELECT
      t.program_id AS request_program_id,
      t.public_id AS id,
      t.team_hash AS team_hash,
      t.created_at AS create_date,
      t.is_active AS is_active,
      t.status AS status,
      w.address as request_user_wallet_address
    FROM
      transfer_request t
      LEFT JOIN user_wallet w ON t.user_wallet_id = w.id
    WHERE
      t.is_active = TRUE
      AND t.receiver_id = ${userId}
  `

  const requestQuery = Prisma.sql`
      SELECT transfer_request.public_id         id,
      transfer_request.status                   status,
      transfer_request.team                     team,
      transfer_request.team_hash                team_hash,
      transfer_request.created_at               create_date,
      transfer_request.amount                   amount,
      transfer_request.vesting_start_epoch      vesting_start_epoch,
      transfer_request.vesting_months           vesting_months,
      transfer_request.program_id               request_program_id,
      transfer_request.currency_unit_id request_currency_unit_id,
      user_wallet.address               request_user_wallet_address,
      blockchain.name                           request_user_wallet_blockchain,
      wallet_verification.is_verified   request_user_wallet_is_verified,
      MAX(CASE WHEN request_user.id = transfer_request.receiver_id THEN request_user.email END) receiver_email,
      MAX(CASE WHEN request_user.id = transfer_request.requester_id THEN request_user.email END) applyer_email,
      MAX(transfer.id)                          transfer_id,
      MAX(review.id)                            review_id
    FROM transfer_request
          INNER JOIN "user" AS request_user ON request_user.id = transfer_request.receiver_id OR request_user.id = transfer_request.requester_id
          LEFT JOIN transfer ON transfer.transfer_request_id = transfer_request.id AND transfer.is_active = TRUE
          LEFT JOIN transfer_request_review review
                    ON review.transfer_request_id = transfer_request.id AND review.is_active = TRUE
          LEFT JOIN user_wallet ON transfer_request.user_wallet_id = user_wallet.id
          LEFT JOIN wallet_verification ON user_wallet.verification_id = wallet_verification.id
          LEFT JOIN blockchain ON user_wallet.blockchain_id = blockchain.id
    WHERE transfer_request.is_active = TRUE
    AND transfer_request.receiver_id = ${userId}
    GROUP BY transfer_request.id, user_wallet.id, wallet_verification.id, blockchain.id
  `

  const draftCount = Prisma.sql`
    SELECT
      d.program_id AS request_program_id,
      d.public_id AS id,
      d.team_hash AS team_hash,
      d.created_at AS create_date,
      d.is_active AS is_active,
      null as status,
      null as request_user_wallet_address
    FROM
      transfer_request_draft d
    WHERE
      d.is_active = TRUE
      AND d.is_submitted = FALSE
      AND d.receiver_id = ${userId}
  `

  const draftQuery = Prisma.sql`
      SELECT
      transfer_request_draft.public_id        id,
      null status,
      transfer_request_draft.team             team,
      transfer_request_draft.team_hash        team_hash,
      transfer_request_draft.created_at       create_date,
      transfer_request_draft.amount           amount,
      null vesting_start_epoch,
      null vesting_months,
      transfer_request_draft.program_id       request_program_id,
      transfer_request_draft.currency_unit_id request_currency_unit_id,
      null request_user_wallet_address,
      null request_user_wallet_blockchain,
      null request_user_wallet_is_verified,
      MAX(CASE WHEN request_user.id = transfer_request_draft.receiver_id THEN request_user.email END) receiver_email,
      MAX(CASE WHEN request_user.id = transfer_request_draft.requester_id THEN request_user.email END) applyer_email,
      0 transfer_id,
      0 review_id

    FROM transfer_request_draft
      INNER JOIN "user" AS request_user ON request_user.id = transfer_request_draft.receiver_id OR request_user.id = transfer_request_draft.requester_id
    WHERE transfer_request_draft.is_active = TRUE
    AND transfer_request_draft.is_submitted = FALSE
    AND transfer_request_draft.receiver_id = ${userId}
    GROUP BY transfer_request_draft.id
  `

  let count = Prisma.sql`
    ${requestCount}
    UNION
    ${draftCount}
  `

  let select = Prisma.sql`
    ${requestQuery}
    UNION
    ${draftQuery}
  `

  if (status) {
    select = requestQuery
    count = requestCount
    const statusMapping = statusFilterMapping[status]
    statusFilter = Prisma.sql`AND filter.status::text IN (${Prisma.join(statusMapping)})`
    if (status === DRAFT_STATUS) {
      select = draftQuery
      count = draftCount
      statusFilter = Prisma.empty
    }
  }

  const [requestsTotalItems] = await prisma.$queryRaw<{ total: number }[]>`
      SELECT
      count(*)::integer AS total
      FROM (
        ${count}
      ) AS filter
        INNER JOIN program ON program.id = filter.request_program_id
        ${programFilter}
        ${createDateFilter}
        ${statusFilter}
        ${numberFilter}
        ${teamFilter}
        ${walletFilter}
    `

  const requests = await prisma.$queryRaw<Request[]>`
    SELECT filter.id                         id,
      filter.status                          status,
      filter.team                            team,
      filter.create_date                     create_date,
      filter.amount                          amount,
      filter.vesting_start_epoch             vesting_start_epoch,
      filter.vesting_months                  vesting_months,
      program.name                           program_name,
      filter.receiver_email                  receiver,
      filter.applyer_email                   applyer,
      COALESCE(transfer.notes, review.notes) notes,
      transfer.tx_hash                       transfer_hash,
      currency_unit.name                     request_unit,
      payment_unit.name                      payment_unit,
      filter.request_user_wallet_address     user_wallet_address,
      filter.request_user_wallet_blockchain  user_wallet_blockchain,
      filter.request_user_wallet_is_verified user_wallet_is_verified
    FROM (
      ${select}
    ) AS filter
        INNER JOIN program ON program.id = filter.request_program_id
        INNER JOIN currency_unit
                  ON currency_unit.id = filter.request_currency_unit_id AND currency_unit.is_active = TRUE
        INNER JOIN program_currency
                  ON program_currency.program_id = program.id AND program_currency.is_active = TRUE AND
                      program_currency.type::text = 'PAYMENT'
        INNER JOIN currency_unit AS payment_unit
                  ON payment_unit.id = program_currency.currency_unit_id
                      AND currency_unit.is_active = TRUE
        LEFT JOIN transfer_request_review review ON review.id = filter.review_id
        LEFT JOIN transfer ON transfer.id = filter.transfer_id
        WHERE program.is_active = TRUE
        ${programFilter}
        ${createDateFilter}
        ${statusFilter}
        ${numberFilter}
        ${walletFilter}
        ${teamFilter}
        ${sortType}
        ${orderBy}
        ${pagination}
  `

  const parsedRequests = await Promise.all(
    requests.map(async request => {
      const [receiver, applyer, team, amount] = await Promise.all([
        decryptPII(request.receiver),
        decryptPII(request.applyer),
        decryptPII(request.team),
        decrypt(request.amount),
      ])

      return {
        ...request,
        receiver,
        applyer,
        team,
        amount,
        status: request.status || DRAFT_STATUS,
      }
    }),
  )

  return { data: { requests: parsedRequests, totalItems: requestsTotalItems.total } }
}

const getSortParams = ({ sort, order }: { sort?: string; order?: string }) => {
  const sortTypes: Record<string, Prisma.Sql> = {
    number: Prisma.sql`ORDER BY filter.id`,
    status: Prisma.sql`ORDER BY filter.status`,
    program: Prisma.sql`ORDER BY program.name`,
    name: Prisma.sql`ORDER BY filter.team`, // FIXME: cannot sort by encrypted fields
    create_date: Prisma.sql`ORDER BY filter.create_date`,
  }

  const orderTypes: Record<string, Prisma.Sql> = {
    desc: Prisma.sql`DESC`,
    asc: Prisma.sql`ASC`,
  }

  const sortType = (sort && sortTypes[sort]) || sortTypes.create_date
  const orderBy = (order && orderTypes[order]) || orderTypes.desc
  return { sortType, orderBy }
}

import { Prisma } from '@prisma/client'
import { decrypt, decryptPII } from 'lib/emissaryCrypto'
import prisma from 'lib/prisma'
import { shortenAddress } from 'lib/shortenAddress'
import { validate } from 'lib/yup'
import { getViewerTransferRequestsValidator } from './validation'

interface SortParams {
  sort?: 'number' | 'program' | 'create_date'
  order?: 'asc' | 'desc'
}

interface GetViewerTransferRequetsParams extends SortParams {
  viewerId: number
  page?: number
  size?: number
  programId?: number[]
  requestNumber?: string
  teamHashes?: string[]
  from?: Date
  to?: Date
  wallets?: string[]
}

interface ViewerTransferRequest {
  id: number
  status: 'PAID'
  team: string
  create_date: string
  amount: string
  program_name: string
  program_id: string
  request_unit: string
  payment_unit: string
  transfer_hash: string
  transfer_amount: string
  transfer_amount_currency_unit_id: number
  transfer_amount_currency_unit: string
  wallet_address: string
  wallet_blockchain: string
  wallet_is_verified: boolean
}

export async function getViewerTransferRequests(params: GetViewerTransferRequetsParams) {
  const { fields, errors } = await validate(getViewerTransferRequestsValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { viewerId, programId, requestNumber, teamHashes, size = 100, page = 1, sort, order, wallets, from, to } = fields

  const currentPage = page - 1 < 0 ? 0 : page - 1
  const pagination = Prisma.sql` LIMIT ${size} OFFSET ${size * currentPage}`
  const { sortType, orderBy } = getSortParams({ sort, order } as SortParams)

  const programFilter = programId && programId.length ? Prisma.sql`AND program.id IN (${Prisma.join(programId)})` : Prisma.empty
  const numberFilter = requestNumber ? Prisma.sql`AND request.public_id = ${requestNumber}` : Prisma.empty
  const teamFilter = teamHashes ? Prisma.sql`AND request.team_hash IN (${Prisma.join(teamHashes)})` : Prisma.empty
  const walletFilter = wallets?.length ? Prisma.sql`AND user_wallet.address IN (${Prisma.join(wallets)})` : Prisma.empty
  const createDateFilter = from && to ? Prisma.sql`AND request.created_at BETWEEN ${from} AND ${to}` : Prisma.empty

  const transferRequests = await prisma.$queryRaw<ViewerTransferRequest[]>`
    SELECT
        request.public_id                                    id,
        request.status                                       status,
        request.team                                         team,
        request.created_at                                   create_date,
        request.amount                                       amount,
        user_file.public_id                                  file_id,
        program.name                                         program_name,
        program.id                                           program_id,
        currency_unit.name                                   request_unit,
        payment_unit.name                                    payment_unit,
        transfer.tx_hash                                     transfer_hash,
        transfer.amount                                      transfer_amount,
        transfer.amount_currency_unit_id                     transfer_amount_currency_unit_id,
        transfer_currency_unit.name                          transfer_amount_currency_unit,
        user_wallet.address                                  wallet_address,
        blockchain.name                                      wallet_blockchain,
        wallet_verification.is_verified                      wallet_is_verified
    FROM user_role
            INNER JOIN user_role_program ON user_role_program.user_role_id = user_role.id AND user_role_program.is_active = TRUE
            INNER JOIN transfer_request request ON request.program_id = user_role_program.program_id AND request.is_active = TRUE
            LEFT JOIN user_file ON user_file.id = request.user_file_id
            LEFT JOIN transfer ON transfer.transfer_request_id = request.id AND transfer.is_active = TRUE
            LEFT JOIN currency_unit AS transfer_currency_unit ON transfer_currency_unit.id = transfer.amount_currency_unit_id AND transfer_currency_unit.is_active = TRUE
            INNER JOIN program ON program.id = request.program_id AND program.is_active = TRUE
            INNER JOIN currency_unit ON currency_unit.id = request.currency_unit_id AND currency_unit.is_active = TRUE
            INNER JOIN program_currency ON program_currency.program_id = program.id AND program_currency.is_active = TRUE AND program_currency.type::text = 'PAYMENT'
            INNER JOIN currency_unit AS payment_unit
                        ON payment_unit.id = program_currency.currency_unit_id
                            AND program.is_active = TRUE
            LEFT JOIN user_wallet ON request.user_wallet_id = user_wallet.id
            LEFT JOIN wallet_verification ON user_wallet.verification_id = wallet_verification.id
            LEFT JOIN blockchain ON user_wallet.blockchain_id = blockchain.id
    WHERE user_role.is_active = TRUE
    AND user_role.role::text = 'VIEWER'
    AND user_role.user_id = ${viewerId}
    AND request.status::text = 'PAID'
    ${programFilter}
    ${numberFilter}
    ${teamFilter}
    ${walletFilter}
    ${createDateFilter}
    ${sortType}
    ${orderBy}
    ${pagination}
  `

  const [transferRequestsTotalItems] = await prisma.$queryRaw<{ total: number }[]>`
      SELECT
	      count(*)::integer AS total
      FROM user_role user_role
      INNER JOIN user_role_program ON user_role_program.user_role_id = user_role.id AND user_role_program.is_active = TRUE
      INNER JOIN transfer_request request ON request.program_id = user_role_program.program_id AND request.is_active = TRUE
      LEFT JOIN transfer ON transfer.transfer_request_id = request.id AND transfer.is_active = TRUE
      LEFT JOIN currency_unit AS transfer_currency_unit ON transfer_currency_unit.id = transfer.amount_currency_unit_id AND transfer_currency_unit.is_active = TRUE
      LEFT JOIN user_wallet ON request.user_wallet_id = user_wallet.id
      INNER JOIN program ON program.id = request.program_id AND program.is_active = TRUE
      INNER JOIN currency_unit ON currency_unit.id = request.currency_unit_id AND currency_unit.is_active = TRUE
      INNER JOIN program_currency ON program_currency.program_id = program.id AND program_currency.is_active = TRUE AND program_currency.type::text = 'PAYMENT'
      INNER JOIN currency_unit AS payment_unit
        ON payment_unit.id = program_currency.currency_unit_id AND program.is_active = TRUE
      WHERE user_role.is_active = TRUE
        AND user_role.role::text = 'VIEWER'
        AND user_role.user_id = ${viewerId}
        AND request.status::text = 'PAID'
        ${programFilter}
        ${numberFilter}
        ${teamFilter}
        ${walletFilter}
        ${createDateFilter}
      `

  const parsedTransferRequests = await Promise.all(
    transferRequests.map(async request => {
      const [amount, transfer_amount, team] = await Promise.all([
        decrypt(request.amount),
        decrypt(request.transfer_amount),
        decryptPII(request.team),
      ])
      return {
        ...request,
        transfer_amount,
        amount,
        team,
        wallet_address: shortenAddress(request.wallet_address, 'very-short'),
      }
    }),
  )

  return {
    data: {
      transfers: parsedTransferRequests,
      totalItems: transferRequestsTotalItems.total,
    },
  }
}

const getSortParams = ({ sort, order }: SortParams) => {
  const sortTypes = {
    number: Prisma.sql`ORDER BY request.public_id`,
    program: Prisma.sql`ORDER BY program.name`,
    create_date: Prisma.sql`ORDER BY request.created_at`,
  }

  const orderTypes = {
    desc: Prisma.sql`DESC`,
    asc: Prisma.sql`ASC`,
  }

  const sortType = sort ? sortTypes[sort] : sortTypes.create_date
  const orderBy = order ? orderTypes[order] : orderTypes.desc

  return { sortType, orderBy }
}

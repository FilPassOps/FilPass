import { Prisma } from '@prisma/client'
import { WalletSize } from 'components/web3/useDelegatedAddress'
import { decrypt, decryptPII } from 'lib/emissaryCrypto'
import { getDelegatedAddress } from 'lib/getDelegatedAddress'
import prisma from 'lib/prisma'
import { shortenAddress } from 'lib/shortenAddress'
import { validate } from 'lib/yup'
import {
  DRAFT_STATUS,
  PROCESSING_STATUS,
  REJECTED_BY_APPROVER_STATUS,
  REJECTED_BY_CONTROLLER_STATUS,
  REJECTED_STATUS,
  SUBMITTED_BY_APPROVER_STATUS,
  SUBMITTED_STATUS,
} from './constants'
import { getApproverTransferRequestsValidator } from './validation'

export async function getApproverTransferRequests(params) {
  const { fields, errors } = await validate(getApproverTransferRequestsValidator, params)
  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { approverId, status, programId, requestNumber, teamHashes, size = 100, page = 1, sort, order, wallets, from, to } = fields

  const currentPage = page - 1 < 0 ? 0 : page - 1
  const pagination = Prisma.sql` LIMIT ${size} OFFSET ${size * currentPage}`
  const { sortType, orderBy } = getSortParams({ sort, order, status })

  const programFilter = programId && programId.length ? Prisma.sql`AND program.id IN (${Prisma.join(programId)})` : Prisma.empty

  const draftNumberFilter = requestNumber ? Prisma.sql`AND draft.public_id = '${requestNumber}'` : Prisma.empty
  const draftTeamFilter = teamHashes ? Prisma.sql`AND draft.team_hash IN (${Prisma.join(teamHashes)})` : Prisma.empty
  const draftWalletFilter = wallets?.length ? Prisma.sql`AND user_wallet.address IN (${Prisma.join(wallets)})` : Prisma.empty
  const draftCreateDateFilter = from && to ? Prisma.sql`AND draft.created_atBETWEEN ${from} AND ${to}` : Prisma.empty

  if (status === DRAFT_STATUS) {
    const drafts = await prisma.$queryRaw`
    SELECT
      draft.public_id                                      id,
      draft.team                                           team,
      draft.created_at                                     create_date,
      draft.amount                                         amount,
      program.name                                         program_name,
      currency_unit.name                                   request_unit,
      payment_unit.name                                    payment_unit
    FROM user_role approver_role
          INNER JOIN user_role_program approver_program ON approver_program.user_role_id = approver_role.id AND approver_program.is_active = TRUE
          INNER JOIN transfer_request_draft AS draft ON draft.program_id = approver_program.program_id AND draft.is_active = TRUE AND draft.is_submitted = FALSE
          INNER JOIN program ON program.id = draft.program_id AND program.is_active = TRUE
          INNER JOIN currency_unit ON currency_unit.id = draft.currency_unit_id AND currency_unit.is_active = TRUE
          INNER JOIN program_currency ON program_currency.program_id = program.id AND program_currency.is_active = TRUE AND program_currency.type::text = 'PAYMENT'
          INNER JOIN currency_unit AS payment_unit ON payment_unit.id = program_currency.currency_unit_id AND program.is_active = TRUE
    WHERE approver_role.is_active = TRUE
    AND approver_role.role::text = 'APPROVER'
    AND approver_role.user_id = ${approverId}
    ${programFilter}
    ${draftNumberFilter}
    ${draftTeamFilter}
    ${draftWalletFilter}
    ${draftCreateDateFilter}
    ${sortType} ${orderBy}
    ${pagination}
  `

    const [transferRequestsTotalItems] = await prisma.$queryRaw`
      SELECT
	      count(*)::integer AS total
      FROM user_role approver_role
        INNER JOIN user_role_program approver_program ON approver_program.user_role_id = approver_role.id AND approver_program.is_active = TRUE
        INNER JOIN transfer_request_draft draft ON draft.program_id = approver_program.program_id AND draft.is_active = TRUE AND draft.is_submitted = FALSE
        INNER JOIN program ON program.id = draft.program_id AND program.is_active = TRUE
        INNER JOIN currency_unit ON currency_unit.id = draft.currency_unit_id AND currency_unit.is_active = TRUE
        INNER JOIN program_currency ON program_currency.program_id = program.id AND program_currency.is_active = TRUE AND program_currency.type::text = 'PAYMENT'
        INNER JOIN currency_unit AS payment_unit ON payment_unit.id = program_currency.currency_unit_id AND program.is_active = TRUE
      WHERE approver_role.is_active = TRUE
        AND approver_role.role::text = 'APPROVER'
        AND approver_role.user_id = ${approverId}
        ${programFilter}
        ${draftNumberFilter}
        ${draftTeamFilter}
        ${draftWalletFilter}
        ${draftCreateDateFilter}
      `

    const parsedDrafts = await Promise.all(
      drafts.map(async request => {
        const [amount, team] = await Promise.all([decrypt(request.amount), decryptPII(request.team)])
        return {
          ...request,
          amount,
          team,
          status: DRAFT_STATUS,
        }
      })
    )
    return {
      data: {
        transfers: parsedDrafts,
        totalItems: transferRequestsTotalItems.total,
      },
    }
  }

  let statusFilter = Prisma.sql`AND request.status::text IN (${Prisma.join([status])})`
  if (status === REJECTED_STATUS) {
    statusFilter = Prisma.sql`AND request.status::text IN (${Prisma.join([
      REJECTED_BY_CONTROLLER_STATUS,
      REJECTED_BY_APPROVER_STATUS,
    ])})`
  }
  if (status === SUBMITTED_STATUS) {
    statusFilter = Prisma.sql`AND (
        request.status::text IN (${Prisma.join([SUBMITTED_STATUS, SUBMITTED_BY_APPROVER_STATUS])})
      OR
        request.status::text = 'PROCESSING'
        AND NOT EXISTS (SELECT 1 FROM transfer_request_approvals tra
          WHERE tra.transfer_request_id = request.id
          AND tra.user_role_program_group_id IN (
            SELECT user_role_program_group_id  FROM user_role_program_group_members urpgm WHERE user_role_program_id = approver_program.id
            )
          )
      )`
  }
  if (status === PROCESSING_STATUS) {
    statusFilter = Prisma.sql`AND request.status::text = 'PROCESSING'
      AND EXISTS (SELECT 1 FROM transfer_request_approvals tra
        WHERE tra.transfer_request_id = request.id AND tra.user_role_id = approver_role.id
        )
      `
  }

  const numberFilter = requestNumber ? Prisma.sql`AND request.public_id = ${requestNumber}` : Prisma.empty
  const teamFilter = teamHashes ? Prisma.sql`AND request.team_hash IN (${Prisma.join(teamHashes)})` : Prisma.empty
  const walletFilter = wallets?.length ? Prisma.sql`AND user_wallet.address IN (${Prisma.join(wallets)})` : Prisma.empty
  const createDateFilter = from && to ? Prisma.sql`AND request.created_at BETWEEN ${from} AND ${to}` : Prisma.empty

  const transferRequests = await prisma.$queryRaw`
    SELECT
        request.public_id                                    id,
        request.status                                       status,
        request.team                                         team,
        request.created_at                                   create_date,
        request.amount                                       amount,
        request.vesting_start_epoch                          vesting_start_epoch,
        request.vesting_months                               vesting_months,
        program.name                                         program_name,
        program.id                                           program_id,
        currency_unit.name                                   request_unit,
        payment_unit.name                                    payment_unit,
        transfer.tx_hash                                     transfer_hash,
        transfer.amount                                      transfer_amount,
        transfer.amount_currency_unit_id                     transfer_amount_currency_unit_id,
        transfer_currency_unit.name                          transfer_amount_currency_unit,
        user_wallet.address                                  wallet_address,
        user_wallet.blockchain                               wallet_blockchain,
        wallet_verification.is_verified                      wallet_is_verified
    FROM user_role approver_role
            INNER JOIN user_role_program approver_program ON approver_program.user_role_id = approver_role.id AND approver_program.is_active = TRUE
            INNER JOIN transfer_request request ON request.program_id = approver_program.program_id AND request.is_active = TRUE
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
    WHERE approver_role.is_active = TRUE
    AND approver_role.role::text = 'APPROVER'
    AND approver_role.user_id = ${approverId}
    ${statusFilter}
    ${numberFilter}
    ${programFilter}
    ${teamFilter}
    ${walletFilter}
    ${createDateFilter}
    ${sortType}
    ${orderBy}
    ${pagination}
  `

  const [transferRequestsTotalItems] = await prisma.$queryRaw`
      SELECT
	      count(*)::integer AS total
      FROM user_role approver_role
      INNER JOIN user_role_program approver_program ON approver_program.user_role_id = approver_role.id AND approver_program.is_active = TRUE
      INNER JOIN transfer_request request ON request.program_id = approver_program.program_id AND request.is_active = TRUE
      LEFT JOIN transfer ON transfer.transfer_request_id = request.id AND transfer.is_active = TRUE
      LEFT JOIN currency_unit AS transfer_currency_unit ON transfer_currency_unit.id = transfer.amount_currency_unit_id AND transfer_currency_unit.is_active = TRUE
      LEFT JOIN user_wallet ON request.user_wallet_id = user_wallet.id
      INNER JOIN program ON program.id = request.program_id AND program.is_active = TRUE
      INNER JOIN currency_unit ON currency_unit.id = request.currency_unit_id AND currency_unit.is_active = TRUE
      INNER JOIN program_currency ON program_currency.program_id = program.id AND program_currency.is_active = TRUE AND program_currency.type::text = 'PAYMENT'
      INNER JOIN currency_unit AS payment_unit
        ON payment_unit.id = program_currency.currency_unit_id AND program.is_active = TRUE
      WHERE approver_role.is_active = TRUE
        AND approver_role.role::text = 'APPROVER'
        AND approver_role.user_id = ${approverId}
        ${statusFilter}
        ${numberFilter}
        ${programFilter}
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
        delegated_address: getDelegatedAddress(request.wallet_address, WalletSize.VERY_SHORT)?.shortAddress,
        wallet_address: shortenAddress(request.wallet_address),
      }
    })
  )

  return {
    data: {
      transfers: parsedTransferRequests,
      totalItems: transferRequestsTotalItems.total,
    },
  }
}

const getSortParams = ({ sort, order, status }) => {
  let sortTypes = {
    number: Prisma.sql`ORDER BY request.public_id`,
    program: Prisma.sql`ORDER BY program.name`,
    create_date: Prisma.sql`ORDER BY request.created_at`,
  }

  if (status === DRAFT_STATUS) {
    sortTypes = {
      number: Prisma.sql`ORDER BY draft.public_id`,
      program: Prisma.sql`ORDER BY program.name`,
      create_date: Prisma.sql`ORDER BY draft.created_at`,
    }
  }

  const orderTypes = {
    desc: Prisma.sql`DESC`,
    asc: Prisma.sql`ASC`,
  }

  const sortType = sortTypes[sort] || sortTypes.create_date
  const orderBy = orderTypes[order] || orderTypes.desc

  return { sortType, orderBy }
}

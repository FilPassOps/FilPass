import { Prisma, TransferRequestStatus } from '@prisma/client'
import { getRequestHistoryByRequestPublicId } from 'domain/tranferRequestHistory/getRequestHistoryByRequestPublicId'
import { getDraftTransferRequestById } from 'domain/transferRequestDraft/getDraftTransferRequestById'
import { decrypt, decryptPII } from 'lib/emissaryCrypto'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { REQUIRES_CHANGES_STATUS } from './constants'
import { isEditable, isVoidable } from './shared'
import { getTransferRequestByIdValidator } from './validation'

interface GetTransferRequestByIdParams {
  transferRequestId: string
  status?: TransferRequestStatus
}

export async function getTransferRequestById(params: GetTransferRequestByIdParams) {
  const { fields, errors } = await validate(getTransferRequestByIdValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { transferRequestId, status } = fields

  const statusFilter = status ? Prisma.sql`AND transfer_request.status::text = ${status}` : Prisma.empty

  const [transferRequest] = await prisma.$queryRaw<any[]>`
  SELECT filter.id                              id,
         filter.private_id                      private_id,
         filter.status                          status,
         filter.team                            team,
         filter.created_at                      created_at,
         filter.expected_transfer_date          expected_transfer_date,
         filter.amount                          amount,
         filter.terms                           terms,
         user_wallet.name                       wallet_name,
         user_wallet.address                    wallet_address,
         user_wallet.id                         wallet_id,
         blockchain.name                        wallet_blockchain_name,
         wallet_verification.is_verified        wallet_is_verified,
         program.name                           program_name,
         program.id                             program_id,
         program.delivery_method                program_delivery_method,
         program.visibility                     program_visibility,
         filter.receiver_email                  receiver,
         filter.receiver_id                     receiver_id,
         filter.applyer_email                   applyer,
         filter.requester_id                    applyer_id,
         COALESCE(transfer.notes, review.notes) notes,
         currency_unit.name                     request_unit,
         payment_unit.name                      payment_unit,
         attachment.type                        attachment_type,
         attachment.public_id                   attachment_id,
         attachment.key                         attachment_key,
         attachment.filename                    attachment_filename,
         attachment_user.email                  attachment_user_email,
         attachment_uploader.email              attachment_uploader_email,
         receiver_user.is_banned                receiver_is_banned,
         ban_actioner_user.email                ban_actioner_email
  FROM (
        SELECT transfer_request.public_id                    id,
              transfer_request.id                           private_id,
              transfer_request.terms                        terms,
              transfer_request.created_at                   created_at,
              transfer_request.expected_transfer_date       expected_transfer_date,
              transfer_request.status                       status,
              transfer_request.team                         team,
              transfer_request.created_at                   create_date,
              transfer_request.amount                       amount,
              transfer_request.program_id                   request_program_id,
              transfer_request.currency_unit_id             request_currency_unit_id,
              transfer_request.user_wallet_id               user_wallet_id,
              transfer_request.user_file_id                 user_file_id,
              transfer_request.receiver_id                  receiver_id,
              transfer_request.requester_id                 requester_id,
              transfer_request.attachment_id                attachment_id,
              MAX(CASE WHEN request_user.id = transfer_request.receiver_id THEN request_user.email END) receiver_email,
              MAX(CASE WHEN request_user.id = transfer_request.requester_id THEN request_user.email END) applyer_email,
              MAX(transfer.id)                              transfer_id,
              MAX(review.id)                                review_id
        FROM transfer_request
                INNER JOIN "user" AS request_user ON request_user.id = transfer_request.receiver_id OR request_user.id = transfer_request.requester_id
                LEFT JOIN transfer ON transfer.transfer_request_id = transfer_request.id AND transfer.is_active = TRUE
                LEFT JOIN transfer_request_review review ON review.transfer_request_id = transfer_request.id AND review.is_active = TRUE
        WHERE transfer_request.is_active = TRUE
          AND transfer_request.public_id = ${transferRequestId}
          ${statusFilter}
        GROUP BY transfer_request.id
    ) AS filter
        INNER JOIN program ON program.id = filter.request_program_id
        INNER JOIN user_wallet ON user_wallet.id = filter.user_wallet_id
        INNER JOIN blockchain ON user_wallet.blockchain_id = blockchain.id
        LEFT JOIN wallet_verification
                  ON user_wallet.verification_id = wallet_verification.id AND wallet_verification.is_active = TRUE
        LEFT JOIN user_file ON user_file.id = filter.user_file_id
        LEFT JOIN "user" AS user_file_user ON user_file_user.id = user_file.user_id
        LEFT JOIN "user" AS user_file_uploader ON user_file_uploader.id = user_file.uploader_id
        INNER JOIN currency_unit
                  ON currency_unit.id = filter.request_currency_unit_id AND currency_unit.is_active = TRUE
        INNER JOIN program_currency
                  ON program_currency.program_id = program.id AND program_currency.is_active = TRUE AND
                      program_currency.type::text = 'PAYMENT'
        INNER JOIN currency_unit AS payment_unit
                  ON payment_unit.id = program_currency.currency_unit_id
                      AND program.is_active = TRUE
        LEFT JOIN user_file AS attachment ON attachment.id = filter.attachment_id
        LEFT JOIN "user" AS attachment_user ON attachment_user.id = attachment.user_id
        LEFT JOIN "user" AS attachment_uploader ON attachment_uploader.id = attachment.uploader_id
        LEFT JOIN transfer_request_review AS review ON review.id = filter.review_id
        LEFT JOIN transfer ON transfer.id = filter.transfer_id
        INNER JOIN "user" AS receiver_user ON filter.receiver_id = receiver_user.id
        LEFT JOIN user_role as ban_actioner_user_role ON ban_actioner_user_role.id = receiver_user.ban_actioned_by_id
        LEFT JOIN "user" as ban_actioner_user ON ban_actioner_user.id = ban_actioner_user_role.user_id;
  `

  if (!transferRequest) {
    const { data: draft, error: draftError } = await getDraftTransferRequestById({
      transferRequestId,
    })

    if (draftError) {
      return {
        error: {
          status: 404,
          message: errorsMessages.not_found.message,
        },
        data: undefined,
      }
    }
    return {
      data: draft,
      error: undefined,
    }
  }

  const { data: history, error: historyError } = await getRequestHistoryByRequestPublicId({
    transferRequestId,
  })

  if (historyError) {
    return {
      error: historyError,
      data: undefined,
    }
  }

  const changesRequested = await prisma.transferRequestReview.findMany({
    orderBy: [{ createdAt: 'desc' }],
    where: {
      isActive: true,
      transferRequest: {
        publicId: transferRequestId,
      },
      status: REQUIRES_CHANGES_STATUS,
    },
    select: {
      id: true,
      createdAt: true,
      notes: true,
    },
  })

  const programCurrency = await prisma.programCurrency.findMany({
    where: {
      programId: transferRequest.program_id,
    },
    select: {
      id: true,
      type: true,
      currency: true,
    },
  })

  const userRoleProgramGroups = await prisma.userRoleProgramGroup.findMany({
    where: {
      programId: transferRequest.program_id,
      role: 'APPROVER',
    },
    select: {
      id: true,
      userRoleProgramGroupMembers: {
        select: {
          userRoleProgram: {
            select: {
              userRole: {
                select: {
                  id: true,
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const transferRequestApprovals = await prisma.transferRequestApprovals.findMany({
    where: {
      transferRequestId: transferRequest.private_id,
    },
    select: {
      userRoleProgramGroupId: true,
      userRole: {
        select: {
          id: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      userRoleProgramGroupId: 'asc',
    },
  })

  const approversGroup: { groupId: number; approved: boolean; members: { email: string; userRoleId: number }[] }[] = []

  for (const approval of transferRequestApprovals) {
    approversGroup.push({
      approved: true,
      groupId: approval.userRoleProgramGroupId,
      members: [{ email: await decryptPII(approval.userRole.user.email), userRoleId: approval.userRole.id }],
    })
  }

  for (const group of userRoleProgramGroups) {
    if (approversGroup.find(approvers => approvers.groupId === group.id)) continue

    const members: { email: string; userRoleId: number }[] = []

    for (const member of group.userRoleProgramGroupMembers) {
      members.push({
        userRoleId: member.userRoleProgram.userRole.id,
        email: await decryptPII(member.userRoleProgram.userRole.user.email),
      })
    }

    if (members.length) {
      approversGroup.push({
        groupId: group.id,
        approved: false,
        members,
      })
    }
  }

  return {
    data: {
      ...transferRequest,
      amount: await decrypt(transferRequest.amount),
      team: await decryptPII(transferRequest.team),
      attachment_user_email: await decryptPII(transferRequest.attachment_user_email),
      attachment_uploader_email: await decryptPII(transferRequest.attachment_uploader_email),
      banActionedBy: await decryptPII(transferRequest.ban_actioner_email),
      receiver: await decryptPII(transferRequest.receiver),
      applyer: await decryptPII(transferRequest.applyer),
      isEditable: isEditable(transferRequest),
      isVoidable: isVoidable(transferRequest),
      history,
      changesRequested,
      programCurrency,
      approversGroup,
    },
    error: undefined,
  }
}

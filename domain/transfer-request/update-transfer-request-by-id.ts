import { TransferRequest } from '@prisma/client'
import { APPROVER_ROLE, USER_ROLE } from 'domain/auth/constants'
import { getAllExternalPrograms } from 'domain/programs/get-all'
import { createRequestChangeHistory } from 'domain/transfer-request-history/create-request-change-history'
import { termsValidator } from 'domain/user/validation'
import { encrypt, encryptPII } from 'lib/emissary-crypto'
import { TransactionError } from 'lib/errors'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import yup, { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { sendSubmittedNotification } from '../notifications/send-submitted-notification'
import { REQUIRES_CHANGES_STATUS, SUBMITTED_STATUS } from './constants'
import { isEditable } from './shared'
import { updateTransferRequestValidator } from './validation'

interface UpdateTransferRequestParams {
  userId: number
  transferRequestId: string
  amount: number
  userAttachmentId?: string
  programId: number
  userWalletId: number
  team: string
  expectedTransferDate: string
  currencyUnitId: number
  user: {
    id: number
    email: string
    terms: yup.Asserts<typeof termsValidator>
  }
}

interface UserPermissionResult {
  id: number
}

export async function updateTransferRequestById(params: UpdateTransferRequestParams) {
  const { user } = params
  const { fields, errors } = await validate(updateTransferRequestValidator, { ...params, userId: user.id })
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { userId, transferRequestId, amount, programId, userWalletId, team, expectedTransferDate, currencyUnitId, userAttachmentId } =
    fields

  const { data, error } = await newPrismaTransaction(async fnPrisma => {
    const [userPermissions, transferRequests] = await Promise.all([
      fnPrisma.$queryRaw`
      SELECT
        MAX(
          CASE
              WHEN user_role.role::text = ${USER_ROLE} AND (transfer_request.receiver_id = ${userId} OR transfer_request.requester_id = ${userId})
                THEN user_role.id
              WHEN user_role.role::text = ${APPROVER_ROLE} AND user_role_program.program_id = transfer_request.program_id
                THEN user_role.id
          END
        ) id
      FROM transfer_request
        LEFT JOIN user_role ON user_role.user_id = ${userId} AND user_role.is_active = TRUE
        LEFT JOIN user_role_program ON user_role_program.user_role_id = user_role.id AND user_role_program.is_active = TRUE
      WHERE transfer_request.is_active = TRUE
      AND transfer_request.public_id = ${transferRequestId}
    `,
      fnPrisma.transferRequest.findMany({
        where: {
          publicId: transferRequestId,
          isActive: true,
        },
        include: {
          wallet: true,
        },
      }),
    ])

    const [currentIteration] = transferRequests
    const [userPermission] = userPermissions as UserPermissionResult[]
    if (!currentIteration || !userPermission.id) {
      throw new TransactionError('Transfer request not found', { status: 404, errors: 'Transfer request not found' })
    }

    const canEdit = isEditable({ ...currentIteration })
    if (!canEdit) {
      throw new TransactionError('Transfer request is not editable', { status: 400, errors: 'Transfer request is not editable' })
    }

    // If the user that is updating the request is the requester,
    // and the program has changed. We need to check if
    // the user has access to the new program
    if (userId === currentIteration.requesterId && currentIteration.programId !== programId) {
      const { data: programs } = await getAllExternalPrograms()
      const program = programs?.find(program => program.id === programId)

      if (!program) {
        throw new TransactionError('Program not found', { status: 400, errors: 'Program not found' })
      }
    }

    const userWallet = await prisma.userWallet.findUnique({ where: { id: userWalletId, userId: user.id } })
    if (userWalletId !== currentIteration.userWalletId && !userWallet) {
      throw new TransactionError('Wallet not found', { status: 400, errors: 'Wallet not found' })
    }

    const program = await prisma.program.findUnique({
      where: { id: programId, isActive: true, isArchived: false },
      include: { currency: { select: { blockchainId: true } } },
    })

    if (program && userWallet && userWallet.blockchainId !== program.currency.blockchainId) {
      throw new TransactionError(errorsMessages.wallet_program_blockchain.message, {
        status: 400,
        errors: errorsMessages.wallet_program_blockchain.message,
      })
    }

    let nextStatus = currentIteration.status
    if (currentIteration.status === REQUIRES_CHANGES_STATUS) {
      nextStatus = SUBMITTED_STATUS
    }

    const [attachmentFile] = await fnPrisma.userFile.findMany({
      where: { publicId: userAttachmentId, OR: [{ uploaderId: userId }, { userId }] },
    })

    const updatedIteration = await fnPrisma.transferRequest.update({
      where: {
        id: currentIteration.id,
      },
      data: {
        amount: await encrypt(amount.toString()),
        team: await encryptPII(team),
        programId,
        userWalletId,
        expectedTransferDate,
        status: nextStatus,
        currencyUnitId,
        attachmentId: userAttachmentId ? attachmentFile.id : null,
      },
      include: {
        wallet: true,
      },
    })

    const newTransferRequestValue = {
      ...currentIteration,
      amount,
      programId,
      userWalletId,
      team,
      expectedTransferDate,
      status: nextStatus,
      currencyUnitId,
      attachmentId: userAttachmentId ? attachmentFile.id : '',
    }

    await createRequestChangeHistory(fnPrisma, {
      newValue: newTransferRequestValue,
      oldValue: { ...currentIteration, attachmentId: userAttachmentId ? attachmentFile.id : '' },
      transferRequestId: updatedIteration.id,
      userRoleId: userPermission.id,
    })

    await sendSubmittedNotification({ programId, transferRequestId: updatedIteration.publicId })

    return newTransferRequestValue
  })

  if (error) {
    return {
      error,
    }
  }

  return {
    data: {
      ...(data as TransferRequest),
      isEditable: isEditable(data as TransferRequest),
    },
  }
}

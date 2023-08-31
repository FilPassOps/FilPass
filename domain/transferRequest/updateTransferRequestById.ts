import { APPROVER_ROLE, USER_ROLE } from 'domain/auth/constants'
import { findAllExternalPrograms } from 'domain/programs/findAll'
import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import { findUserTaxForm } from 'domain/user'
import { encrypt, encryptPII } from 'lib/emissaryCrypto'
import { TransactionError } from 'lib/errors'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { DateTime } from 'luxon'
import { sendSubmittedNotification } from '../notifications/sendSubmittedNotification'
import { BLOCKED_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_STATUS } from './constants'
import { isEditable } from './shared'
import { updateTransferRequestValidator } from './validation'
import { TransferRequest } from '@prisma/client'

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
    firstName: string
    lastName: string
    dateOfBirth: string
    countryResidence: string
    isUSResident: boolean
    email: string
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

  const { firstName, lastName, dateOfBirth: dateOfBirthString, countryResidence, isUSResident } = user
  const dateOfBirth = new Date(dateOfBirthString)

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
      throw new TransactionError('Transfer request not found', { status: 404, errors: undefined })
    }

    const canEdit = isEditable({ ...currentIteration })
    if (!canEdit) {
      throw new TransactionError('Transfer request is not editable', { status: 400, errors: undefined })
    }

    // If the user that is updating the request is the requester,
    // and the program has changed. We need to check if
    // the user has access to the new program
    if (userId === currentIteration.requesterId && currentIteration.programId !== programId) {
      const { data: programs } = await findAllExternalPrograms()
      const program = programs?.find(program => program.id === programId)

      if (!program) {
        throw new TransactionError('Program not found', { status: 400, errors: undefined })
      }
    }

    if (userWalletId !== currentIteration.userWalletId) {
      const userWallet = await prisma.userWallet.findUnique({ where: { id: userWalletId, userId: user.id } })

      if (!userWallet) {
        throw new TransactionError('Wallet not found', { status: 400, errors: undefined })
      }
    }

    let nextStatus = currentIteration.status
    if (currentIteration.status === REQUIRES_CHANGES_STATUS) {
      nextStatus = SUBMITTED_STATUS
    }

    const formFile = await findUserTaxForm(userId)

    const [attachmentFile] = await fnPrisma.userFile.findMany({
      where: { publicId: userAttachmentId, OR: [{ uploaderId: userId }, { userId }] },
    })

    if (!formFile?.isApproved) {
      nextStatus = BLOCKED_STATUS //BLOCKED and ON_HOLD mean the same
    }

    const updatedIteration = await fnPrisma.transferRequest.update({
      where: {
        id: currentIteration.id,
      },
      data: {
        amount: await encrypt(amount.toString()),
        team: await encryptPII(team),
        userFileId: formFile?.id,
        programId,
        userWalletId,
        firstName: await encryptPII(firstName),
        lastName: await encryptPII(lastName),
        dateOfBirth: dateOfBirth && (await encryptPII(DateTime.fromJSDate(dateOfBirth).toISO() as string)),
        countryResidence: await encryptPII(countryResidence),
        isUSResident,
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
      userFileId: formFile?.id,
      programId,
      userWalletId,
      team,
      isUSResident,
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

import { sendSubmittedNotification } from 'domain/notifications/sendSubmittedNotification'
import { BLOCKED_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { findUserTaxForm, isUserSanctioned } from 'domain/user'
import { encrypt, encryptPII } from 'lib/emissaryCrypto'
import { TransactionError } from 'lib/errors'
import { generateTeamHash } from 'lib/password'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { DateTime } from 'luxon'
import { submitDraftTransferRequestByIdValidator } from './validation'
import { TransferRequestStatus, User } from '@prisma/client'

interface SubmitDraftTransferRequestByIdParams {
  applyerId: number
  userId: number
  publicId: string
  amount: number
  userAttachmentId: string
  programId: number
  userWalletId: number
  team: string
  expectedTransferDate: string
  currencyUnitId: number
  user: User
}

export async function submitDraftTransferRequestById(params: SubmitDraftTransferRequestByIdParams) {
  const { user } = params
  const { fields, errors } = await validate(submitDraftTransferRequestByIdValidator, { ...params, userId: user.id })
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { userId, publicId, amount, programId, userWalletId, team, expectedTransferDate, currencyUnitId, applyerId, userAttachmentId } =
    fields

  const { firstName, lastName, dateOfBirth: dateOfBirthString, countryResidence, terms, isUSResident } = user
  const dateOfBirth = dateOfBirthString ? new Date(dateOfBirthString) : null
  const checkSanctionResult = await isUserSanctioned(userId)
  const formFile = await findUserTaxForm(userId)

  return await newPrismaTransaction(async fnPrisma => {
    let status: TransferRequestStatus = SUBMITTED_STATUS

    if (checkSanctionResult === null || checkSanctionResult.isSanctioned || !formFile?.isApproved) {
      status = BLOCKED_STATUS //BLOCKED and ON_HOLD mean the same
    }

    const [attachmentFile] = await fnPrisma.userFile.findMany({
      where: { publicId: userAttachmentId ?? null, userId },
    })

    const birth = dateOfBirth ? DateTime.fromJSDate(dateOfBirth).toISO() : null

    const transferRequest = await fnPrisma.transferRequest.create({
      data: {
        publicId,
        amount: await encrypt(amount?.toString()),
        userFileId: formFile?.id,
        programId,
        userWalletId,
        team: await encryptPII(team),
        teamHash: await generateTeamHash(team),
        firstName: firstName ? await encryptPII(firstName) : null,
        lastName: lastName ? await encryptPII(lastName) : null,
        dateOfBirth: birth,
        countryResidence: countryResidence ? await encryptPII(countryResidence) : null,
        isUSResident,
        terms: terms ? terms : undefined,
        expectedTransferDate,
        receiverId: userId,
        requesterId: applyerId,
        currencyUnitId,
        attachmentId: attachmentFile?.id,
        isSanctioned: checkSanctionResult?.isSanctioned,
        sanctionReason:
          checkSanctionResult?.isSanctioned && checkSanctionResult?.sanctionReason
            ? await encryptPII(checkSanctionResult?.sanctionReason)
            : null,
        status,
      },
      include: {
        wallet: true,
      },
    })

    if (!transferRequest) {
      throw new TransactionError('Transfer request not found', { status: 404, errors: undefined })
    }

    const draft = await fnPrisma.transferRequestDraft.updateMany({
      where: {
        publicId,
        receiverId: userId,
        isActive: true,
        isSubmitted: false,
      },
      data: {
        isSubmitted: true,
      },
    })

    if (draft.count <= 0) {
      throw new TransactionError('Draft Transfer request not found', { status: 404, errors: undefined })
    }

    await sendSubmittedNotification({
      programId,
      transferRequestId: transferRequest.publicId,
    })

    return { publicId: transferRequest.publicId, error: null }
  })
}

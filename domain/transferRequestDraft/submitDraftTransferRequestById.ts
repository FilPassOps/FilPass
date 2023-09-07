import { sendSubmittedNotification } from 'domain/notifications/sendSubmittedNotification'
import { SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { encrypt, encryptPII } from 'lib/emissaryCrypto'
import { TransactionError } from 'lib/errors'
import { generateTeamHash } from 'lib/password'
import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
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

  const { terms } = user

  return await newPrismaTransaction(async fnPrisma => {
    const status: TransferRequestStatus = SUBMITTED_STATUS

    const [attachmentFile] = await fnPrisma.userFile.findMany({
      where: { publicId: userAttachmentId ?? null, userId },
    })

    const transferRequest = await fnPrisma.transferRequest.create({
      data: {
        publicId,
        amount: await encrypt(amount?.toString()),
        programId,
        userWalletId,
        team: await encryptPII(team),
        teamHash: await generateTeamHash(team),

        terms: terms ? terms : undefined,
        expectedTransferDate,
        receiverId: userId,
        requesterId: applyerId,
        currencyUnitId,
        attachmentId: attachmentFile?.id,
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

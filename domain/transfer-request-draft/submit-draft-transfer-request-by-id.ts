import { TransferRequestStatus, User } from '@prisma/client'
import { sendSubmittedNotification } from 'domain/notifications/send-submitted-notification'
import { SUBMITTED_STATUS } from 'domain/transfer-request/constants'
import { encrypt, encryptPII } from 'lib/emissary-crypto'
import { generateTeamHash } from 'lib/password'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { submitDraftTransferRequestByIdValidator } from './validation'

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

  const [userWallet, program] = await Promise.all([
    prisma.userWallet.findUnique({ where: { id: userWalletId, userId: user.id } }),
    prisma.program.findUnique({ where: { id: programId } }),
  ])

  if (!userWallet) {
    return {
      error: {
        status: 400,
        errors: { userWalletId: errorsMessages.wallet_not_found.message },
      },
    }
  }

  if (!program) {
    return {
      error: {
        status: 400,
        errors: { programId: errorsMessages.program_not_found.message },
      },
    }
  }

  if (userWallet.blockchainId !== program.blockchainId) {
    return {
      error: {
        status: 400,
        errors: { userWalletId: errorsMessages.wallet_program_blockchain.message },
      },
    }
  }

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
      return {
        error: {
          status: 400,
          errors: { id: 'Draft Transfer request not found' },
        },
      }
    }

    await sendSubmittedNotification({
      programId,
      transferRequestId: transferRequest.publicId,
    })

    return { publicId: transferRequest.publicId, error: null }
  })
}

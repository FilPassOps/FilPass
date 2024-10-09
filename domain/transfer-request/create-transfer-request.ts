import { TransferRequestStatus } from '@prisma/client'
import { encrypt, encryptPII } from 'lib/emissary-crypto'
import { generateTeamHash } from 'lib/password'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { SUBMITTED_STATUS } from './constants'
import { createTransferRequestValidatorBackend } from './validation'

interface CreateTransferRequestParams {
  amount: string
  programId: string
  userWalletId: string
  team: string
  expectedTransferDate: string
  currencyUnitId: string
  userAttachmentId?: string
  user: {
    id: number
    terms: boolean
    email: string
  }
}

export async function createTransferRequest(params: CreateTransferRequestParams) {
  const { fields, errors } = await validate(createTransferRequestValidatorBackend, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { amount, programId, userWalletId, team, expectedTransferDate, user, currencyUnitId, userAttachmentId } = fields

  const userWallet = await prisma.userWallet.findUnique({ where: { id: userWalletId, userId: user.id } })

  if (!userWallet) {
    return {
      error: {
        status: 400,
        errors: { userWalletId: errorsMessages.wallet_not_found.message },
      },
    }
  }

  const status: TransferRequestStatus = SUBMITTED_STATUS

  const [attachmentFile] = await prisma.userFile.findMany({
    where: { publicId: userAttachmentId ?? null, userId: user.id },
  })

  const transferRequest = await prisma.transferRequest.create({
    data: {
      amount: await encrypt(amount.toString()),
      programId,
      userWalletId,
      team: await encryptPII(team),
      teamHash: await generateTeamHash(team),
      terms: user.terms,
      expectedTransferDate,
      receiverId: user.id,
      requesterId: user.id,
      currencyUnitId,
      attachmentId: userAttachmentId ? attachmentFile?.id : undefined,
      status,
    },
    include: {
      wallet: true,
    },
  })

  return { data: transferRequest }
}

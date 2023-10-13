import { Prisma, ProgramCurrencyType } from '@prisma/client'
import { SYSTEM_USER_ROLE_ID } from 'domain/auth/constants'
import { sendPaidVerification } from 'domain/notifications/send-paid-notification'
import { PROGRAM_TYPE_INTERNAL } from 'domain/programs/constants'
import { APPROVED_STATUS, PAID_STATUS } from 'domain/transfer-request/constants'
import { decryptPII, encrypt } from 'lib/emissary-crypto'
import prisma from 'lib/prisma'
import { SUCCESS_STATUS } from './constants'

export const select = {
  transferRef: true,
  id: true,
  transferRequest: {
    select: {
      id: true,
      publicId: true,
      robustAddress: true,
      actorAddress: true,
      status: true,
      amount: true,
      wallet: {
        select: {
          address: true,
        },
      },
      receiver: {
        select: {
          email: true,
        },
      },
      program: {
        select: {
          visibility: true,
          programCurrency: {
            select: {
              currencyUnitId: true,
            },
            where: {
              type: ProgramCurrencyType.PAYMENT,
            },
          },
        },
      },
    },
  },
}

export type TransferResult = Prisma.TransferGetPayload<{ select: typeof select }>

interface UpdateTransferParams {
  id: number
  transferRequest: TransferResult['transferRequest']
  hash: string
  amount: number
  sendEmail?: boolean
}

export async function updateTransfer({ id, transferRequest, hash, amount, sendEmail = false }: UpdateTransferParams) {
  const { id: transferRequestId, status, publicId, receiver, program } = transferRequest
  const encryptedAmount = await encrypt(amount.toString())
  const receiverEmail = await decryptPII(receiver.email)
  const currencyUnitId = program.programCurrency.pop()?.currencyUnitId
  try {
    await prisma.$transaction([
      prisma.transfer.update({
        where: {
          id,
          isActive: true,
          status: {
            not: SUCCESS_STATUS,
          },
        },
        data: {
          status: SUCCESS_STATUS,
          txHash: hash,
          amount: encryptedAmount,
          amountCurrencyUnitId: currencyUnitId,
        },
      }),
      prisma.transferRequest.update({
        where: {
          id: transferRequestId,
          status: APPROVED_STATUS,
          isActive: true,
        },
        data: {
          status: PAID_STATUS,
        },
      }),
      prisma.transferRequestHistory.create({
        data: {
          transferRequestId: transferRequestId,
          newValue: PAID_STATUS,
          oldValue: status.toString(),
          field: 'status',
          userRoleId: SYSTEM_USER_ROLE_ID,
        },
      }),
    ])

    if (transferRequest.program.visibility !== PROGRAM_TYPE_INTERNAL && sendEmail) {
      sendPaidVerification({
        email: receiverEmail,
        transferRequestId: publicId,
      })
    }
    return true
  } catch (error: any) {
    console.error(error)
    throw new Error('Failed to update transfer: ' + error?.message)
  }
}

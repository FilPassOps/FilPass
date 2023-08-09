import Bottleneck from 'bottleneck'
import { SYSTEM_USER_ROLE_ID } from 'domain/auth/constants'
import { sendPaidVerification } from 'domain/notifications/sendPaidNotification'
import { PROGRAM_TYPE_INTERNAL } from 'domain/programs/constants'
import { createRequestChangeHistory } from 'domain/tranferRequestHistory/createRequestChangeHistory'
import { APPROVED_STATUS, PAID_STATUS } from 'domain/transferRequest/constants'
import { decryptTransferRequest } from 'domain/transferRequest/crypto'
import { decryptPII, encrypt } from 'lib/emissaryCrypto'
import { TransactionError } from 'lib/errors'
import { ATTOFIL, FIL, convert } from 'lib/filecoin'
import { chainGetMessageId } from 'lib/filecoinApi'
import { getPrismaClient, newPrismaTransaction } from 'lib/prisma'
import { FILECOIN_CURRENCY_NAME, PENDING_STATUS, SUCCESS_STATUS } from './constants'

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 333,
})

export async function run() {
  const prisma = await getPrismaClient()

  const pendingTransfers = await prisma.scriptTransaction.findMany({
    take: 720,
    where: {
      isActive: true,
      isProcessed: false,
    },
  })

  if (pendingTransfers.length <= 0) {
    return {
      data: {
        found: 0,
        message: 'There are no pending transfers to process',
      },
    }
  }

  const processResult = await Promise.all(pendingTransfers.map(item => limiter.schedule(async () => verifyAndUpdate(item))))

  const response = processResult.reduce(
    (acc, result) => {
      if (result) {
        return {
          ...acc,
          updated: ++acc.updated,
          remaining: --acc.remaining,
        }
      }

      return {
        ...acc,
        failed: ++acc.failed,
      }
    },
    {
      found: pendingTransfers.length,
      updated: 0,
      failed: 0,
      remaining: pendingTransfers.length,
    }
  )

  return {
    data: response,
  }
}

async function verifyAndUpdate({ id, transaction }) {
  const { data } = await chainGetMessageId(transaction)

  if (data?.error) {
    console.log('Error getting message id', data)
    return false
  }

  // get transferRef -> it's the relation between chain and transfer
  if (!data?.result?.Params) {
    console.log('No Params found')
    return false
  }
  const transferRef = Buffer.from(data?.result?.Params, 'base64').toString('utf-8')
  const prisma = await getPrismaClient()
  const [transfer] = await prisma.transfer.findMany({
    where: {
      transferRef,
      isActive: true,
      status: PENDING_STATUS,
    },
    select: {
      id: true,
      transferRef: true,
      transferRequest: {
        include: {
          receiver: true,
          wallet: true,
          program: {
            select: {
              visibility: true,
            },
          },
        },
      },
    },
  })
  if (!transfer) {
    console.log('Transfer not found', { status: 404 })
    return false
  }

  const transferWalletAddress = transfer.transferRequest.wallet.address
  if (transferWalletAddress !== data.result.To) {
    console.log(
      `Transaction wallet address doesn't match request wallet address `,
      `Found:${data.result.To} Actual:${transferWalletAddress} Params:${data.result.Params}`
    )
    return false
  }

  return updateTransfer({
    id,
    transferId: transfer.id,
    transferRequest: transfer.transferRequest,
    txHash: transaction,
    amount: data.result.Value,
  })
}

async function updateTransfer({ id, transferId, transferRequest, txHash, amount }) {
  const { error } = await newPrismaTransaction(async fnPrisma => {
    await fnPrisma.scriptTransaction.updateMany({
      where: {
        id,
        isProcessed: false,
      },
      data: {
        isProcessed: true,
      },
    })

    const filCurrency = await fnPrisma.currencyUnit.findUnique({
      where: {
        name: FILECOIN_CURRENCY_NAME,
      },
    })

    if (!filCurrency) {
      throw new TransactionError('FIL currency not found', { status: 404 })
    }

    const filAmount = convert(amount, ATTOFIL, FIL)
    const { count: transferUpdatedCount } = await fnPrisma.transfer.updateMany({
      where: {
        id: transferId,
        isActive: true,
        status: {
          not: SUCCESS_STATUS,
        },
      },
      data: {
        status: SUCCESS_STATUS,
        txHash,
        amount: await encrypt(filAmount.toString()),
        amountCurrencyUnitId: filCurrency.id,
      },
    })

    if (transferUpdatedCount <= 0) {
      throw new TransactionError('Transfer not found', { status: 404 })
    }

    const { count: transferRequestUpdatedCount } = await fnPrisma.transferRequest.updateMany({
      where: {
        id: transferRequest.id,
        status: APPROVED_STATUS,
        isActive: true,
      },
      data: {
        status: PAID_STATUS,
      },
    })

    if (transferRequestUpdatedCount <= 0) {
      throw new TransactionError('Transfer request not found', { status: 404 })
    }

    const decryptedTransferRequest = await decryptTransferRequest(transferRequest)

    const { receiver, ...currentTransferRequest } = decryptedTransferRequest
    const updatedTransferRequest = {
      ...currentTransferRequest,
      status: PAID_STATUS,
    }

    await createRequestChangeHistory(fnPrisma, {
      newValue: updatedTransferRequest,
      oldValue: currentTransferRequest,
      transferRequestId: transferRequest.id,
      userRoleId: SYSTEM_USER_ROLE_ID,
    })

    if (transferRequest?.program?.visibility !== PROGRAM_TYPE_INTERNAL) {
      const receiverEmail = await decryptPII(receiver.email)
      await sendPaidVerification({
        email: receiverEmail,
        transferRequestId: transferRequest.publicId,
      })
    }
  })

  if (error) {
    console.log('Infura API verification job - Error updating transfer: ', error)
  }

  return !error
}

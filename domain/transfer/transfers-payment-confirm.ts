import { ethers } from 'ethers'
import { logger } from 'lib/logger'
import prisma from 'lib/prisma'
import { PENDING_STATUS } from './constants'
import { TransferResult, select, updateTransfer } from './payment-db-transfer-verification-job'

interface TransferPaymentConfirmParams {
  id: string
  to: string[]
  from: string
  value: ethers.BigNumber[]
  transactionHash: string
  tokenDecimal: number
}

export const transferPaymentConfirm = async ({ id, to, from, value, transactionHash }: TransferPaymentConfirmParams) => {
  const pendingTransfers = await prisma.transfer.findMany({
    select: select,
    where: {
      isActive: true,
      status: PENDING_STATUS,
      transferRef: id,
      txHash: transactionHash,
      from: from.toLowerCase(),
    },
  })

  if (pendingTransfers.length > 0) {
    return
  }

  const pendingTransfersWithNoTxHash = await prisma.transfer.findMany({
    select: select,
    where: {
      status: 'PENDING',
      transferRef: id,
      txHash: null,
    },
  })

  if (pendingTransfersWithNoTxHash.length === 0) {
    return
  }

  await prisma.transfer.updateMany({
    where: {
      id: {
        in: pendingTransfersWithNoTxHash.map(transfer => transfer.id),
      },
      txHash: null,
      from: from.toLowerCase(),
    },
    data: {
      txHash: transactionHash,
      isActive: true,
    },
  })

  processPayment(pendingTransfersWithNoTxHash, to, value, transactionHash)

  if (pendingTransfersWithNoTxHash.length > 0) {
    logger.warning('Transfer request with no transaction hash set as Paid', {
      transferRef: id,
      transactionHash: transactionHash,
      transferIds: pendingTransfersWithNoTxHash.map(transfer => transfer.id),
    })
  }
}

const processPayment = async (
  pendingTransfers: TransferResult[],
  to: string[],
  value: ethers.BigNumber[],
  transactionHash: string,
) => {
  for (let i = 0; i < to.length; i++) {
    const receiver = to[i].toLowerCase()
    const transfers = []
    for await (const transfer of pendingTransfers) {
      try {
        const { actorAddress, robustAddress, wallet } = transfer.transferRequest

        if (
          actorAddress.toLowerCase() === receiver ||
          robustAddress.toLowerCase() === receiver ||
          wallet.address.toLowerCase() === receiver
        ) {
          transfers.push(transfer)
        }
      } catch (error) {
        logger.error('Error verifying payment - invalid wallet address', {
          transferRef: transfer.transferRef,
          transactionHash: transactionHash,
          walletAddress: transfer.transferRequest.wallet.address,
        })
      }
    }

    if (transfers.length) {
      for (const transfer of transfers) {
        const { actorAddress, robustAddress } = transfer.transferRequest
        const sendEmail = !(actorAddress === receiver || robustAddress === receiver)

        try {
          await updateTransfer({
            id: transfer.id,
            transferRequest: transfer.transferRequest,
            hash: transactionHash,
            sendEmail,
          })
        } catch (error) {
          logger.error('Error updating transfer', error)
        }
      }
    }
  }
}

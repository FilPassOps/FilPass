import { ethers } from 'ethers'
import { decrypt } from 'lib/emissaryCrypto'
import { validateWalletAddress } from 'lib/filecoinShipyard'
import { amountConverter, getDelegatedAddress, hexAddressDecoder } from 'lib/getDelegatedAddress'
import prisma from 'lib/prisma'
import { TransferResult, select, updateTransfer } from './paymentDbTransferVerificationJob'
import { logger } from 'lib/logger'

interface TransferPaymentConfirmParams {
  id: string
  to: string[]
  from: string
  value: ethers.BigNumber[]
  transactionHash: string
}

export const transferPaymentConfirm = async ({ id, to, from, value, transactionHash }: TransferPaymentConfirmParams) => {
  const pendingTransfers = await prisma.transfer.findMany({
    select: select,
    where: {
      isActive: true,
      status: 'PENDING',
      transferRef: id,
      txHash: transactionHash,
      from: from.toLowerCase(),
    },
  })

  processPayment(pendingTransfers, to, value, transactionHash)

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

const processPayment = async (pendingTransfers: TransferResult[], to: string[], value: ethers.BigNumber[], transactionHash: string) => {
  for (let i = 0; i < to.length; i++) {
    const receiver = hexAddressDecoder(to[i])
    const paidAmount = amountConverter(value[i])

    const transfers = []
    for await (const transfer of pendingTransfers) {
      try {
        const { actorAddress, robustAddress, wallet, amount } = transfer.transferRequest
        const decryptedAmount = await decrypt(amount)
        const finalAddress = getDelegatedAddress(wallet.address)?.fullAddress || wallet.address
        const alias = await validateWalletAddress(finalAddress)

        const isAddressValid = actorAddress === receiver || robustAddress === receiver || wallet.address === receiver || alias === receiver
        if (isAddressValid && Number(decryptedAmount) === Number(paidAmount)) {
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
            amount: Number(paidAmount),
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

import { ethers } from 'ethers'
import { WalletSize, amountConverter, getDelegatedAddress, hexAddressDecoder } from 'lib/getDelegatedAddress'
import { logger } from 'lib/logger'
import prisma from 'lib/prisma'
import { AppConfig } from 'system.config'
import { TransferResult, select, updateTransfer } from './paymentDbTransferVerificationJob'
import { PENDING_STATUS } from './constants'

interface TransferPaymentConfirmParams {
  id: string
  to: string[]
  from: string
  value: ethers.BigNumber[]
  transactionHash: string
  contractAddress: string
}

export const transferPaymentConfirm = async ({ id, to, from, value, transactionHash, contractAddress }: TransferPaymentConfirmParams) => {
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

  const chainName = AppConfig.network.chains.find(chain => chain.contractAddress === contractAddress)?.name

  if (!chainName) {
    logger.error('Chain name not found')
    throw new Error('Chain name not found')
  }

  processPayment(chainName, pendingTransfers, to, value, transactionHash)

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

  processPayment(chainName, pendingTransfersWithNoTxHash, to, value, transactionHash)

  if (pendingTransfersWithNoTxHash.length > 0) {
    logger.warning('Transfer request with no transaction hash set as Paid', {
      transferRef: id,
      transactionHash: transactionHash,
      transferIds: pendingTransfersWithNoTxHash.map(transfer => transfer.id),
    })
  }
}

const processPayment = async (
  chainName: string,
  pendingTransfers: TransferResult[],
  to: string[],
  value: ethers.BigNumber[],
  transactionHash: string,
) => {
  for (let i = 0; i < to.length; i++) {
    const receiver = hexAddressDecoder(chainName, to[i])
    const paidAmount = amountConverter(value[i])

    const transfers = []
    for await (const transfer of pendingTransfers) {
      try {
        const { actorAddress, robustAddress, wallet } = transfer.transferRequest
        const delegatedAddress = getDelegatedAddress(wallet.address, WalletSize.SHORT, chainName)?.fullAddress || wallet.address

        const isAddressMatch =
          actorAddress === receiver || robustAddress === receiver || wallet.address === receiver || delegatedAddress === receiver
        if (isAddressMatch) {
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

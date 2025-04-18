import { sendWalletVerificationNotification } from 'domain/notifications/send-wallet-verification-notification'
import prisma from 'lib/prisma'
import { sanctionCheck } from 'lib/sanction-check-api'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface CreateEthereumWalletRequestParams {
  userId: number
  address: string
  label?: string
  email: string
  blockchain: string
}

export async function createEthereumWallet(params: CreateEthereumWalletRequestParams) {
  const { userId, address, label, email, blockchain } = params

  const blockchainEntity = await prisma.blockchain.findUnique({ where: { name: blockchain } })

  if (!blockchainEntity) {
    return {
      error: {
        status: 400,
        errors: {
          address: errorsMessages.wallet_blockchain_not_found,
        },
      },
    }
  }

  const checkAddressResult = await sanctionCheck.checkAddress(address)

  const result = await prisma.$transaction(async tx => {
    const walletVerification = await tx.walletVerification.create({
      data: {
        userId,
        address,
        blockchainId: blockchainEntity.id,
      },
    })

    const userWallet = await tx.userWallet.upsert({
      where: {
        userId_address_blockchainId: { address, userId, blockchainId: blockchainEntity.id },
      },
      update: {
        isActive: false,
        verificationId: walletVerification.id,
        name: label,
      },
      create: {
        userId,
        address,
        blockchainId: blockchainEntity.id,
        name: label,
        isActive: false,
        verificationId: walletVerification.id,
      },
      select: {
        id: true,
      },
    })

    if (checkAddressResult && checkAddressResult.isSanctioned) {
      await tx.user.update({
        where: { id: userId },
        data: {
          isBanned: checkAddressResult.isSanctioned,
          banReason: JSON.stringify(checkAddressResult.details),
        },
      })
    }

    return userWallet
  })

  if (!result) {
    throw new Error('Wallet not found')
  }

  await sendWalletVerificationNotification({ address, id: result.id, email, userId })

  return {
    data: result,
  }
}

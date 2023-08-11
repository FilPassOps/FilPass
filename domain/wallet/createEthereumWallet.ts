import { sendWalletVerificationNotification } from 'domain/notifications/sendWalletVerificationNotification'
import prisma from 'lib/prisma'

interface CreateEthereumWalletRequestParams {
  userId: number
  address: string
  label?: string
  email: string
  blockchain: string // TODO OPEN-SOURCE: should the id of the blockchain table
}

export async function createEthereumWallet(params: CreateEthereumWalletRequestParams) {
  const { userId, address, label, email, blockchain } = params

  const result = await prisma.$transaction(async tx => {
    const walletVerification = await tx.walletVerification.create({
      data: {
        userId,
        address,
        blockchainId: 1, // TODO OPEN-SOURCE: should get the value from params
        transactionContent: Math.floor(Math.random() * 1000000),
        transactionId: '0x',
        isVerified: true,
      },
    })

    const userWallet = await tx.userWallet.upsert({
      where: {
        userId_address: { address, userId },
      },
      update: {
        isActive: false,
        verificationId: walletVerification.id,
        name: label,
      },
      create: {
        userId,
        address,
        blockchainId: 1, // TODO OPEN-SOURCE: should get the value from params
        name: label,
        isActive: false,
        verificationId: walletVerification.id,
      },
      select: {
        id: true,
      },
    })
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

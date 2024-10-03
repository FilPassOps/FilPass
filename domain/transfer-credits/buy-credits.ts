import prisma from 'lib/prisma'
import { saveTransferCreditsValidator } from './validation'
import { AppConfig } from 'config/system'

interface BuyCreditsParams {
  from: string
  to: string
  amount: string
  userId: number
  hash: string
  unit: string
}

export const buyCredits = async (props: BuyCreditsParams) => {
  try {
    const fields = await saveTransferCreditsValidator.validate(props)

    const usdc = AppConfig.network.getTokenBySymbolAndBlockchainName('USDC', 'Ethereum')

    if (!usdc) {
      throw new Error('USDC token not found')
    }

    // TODO: check minimum offer price
    // if (fields.offerPrice === '0') {
    //   throw new Error('Offer price cannot be 0')
    // }

    if (!validateAddress(fields.to)) {
      throw new Error('Invalid storage provider address')
    }

    let storageProvider = await prisma.storageProvider.findUnique({
      where: {
        walletAddress: fields.to,
      },
    })

    if (!storageProvider) {
      storageProvider = await prisma.storageProvider.create({
        data: {
          walletAddress: fields.to,
        },
      })
    }

    const existingUserCredit = await prisma.userCredit.findFirst({
      where: {
        userId: fields.userId,
        storageProviderId: storageProvider.id,
      },
    })

    // TODO: encrypt amount and other important info
    await prisma.$transaction(async tx => {
      const userCredit = existingUserCredit
        ? existingUserCredit
        : await tx.userCredit.create({
            data: {
              userId: fields.userId,
              storageProviderId: storageProvider.id,
              amount: fields.amount,
            },
          })

      await tx.creditTransaction.create({
        data: {
          from: fields.from,
          storageProviderId: storageProvider.id,
          transactionHash: fields.hash,
          status: 'PENDING',
          amount: fields.amount,
          userCreditId: userCredit.id,
        },
      })
    })

    return { message: 'Success' }
  } catch (error) {
    console.log('Error creating comment', error)
    return { error: 'Something went wrong' }
  }
}

// TODO: add existing validate address
const validateAddress = (address: string) => {
  return address.startsWith('0x') || address.startsWith('f1') || address.startsWith('f3')
}

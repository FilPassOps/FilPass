import prisma from 'lib/prisma'
import { saveTransferCreditsValidator } from './validation'
import { AppConfig } from 'config/system'
import { parseUnits } from 'ethers/lib/utils'

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

    const fil = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')

    if (!fil) {
      throw new Error('FIL token not found')
    }

    // TODO: check minimum offer price
    // if (fields.offerPrice === '0') {
    //   throw new Error('Offer price cannot be 0')
    // }

    if (!validateAddress(fields.to)) {
      throw new Error('Invalid storage provider address')
    }

    let creditStorageProvider = await prisma.storageProvider.findUnique({
      where: {
        walletAddress: fields.to,
      },
    })

    if (!creditStorageProvider) {
      creditStorageProvider = await prisma.storageProvider.create({
        data: {
          walletAddress: fields.to,
        },
      })
    }

    const existingUserCredit = await prisma.userCredit.findFirst({
      where: {
        userId: fields.userId,
        storageProviderId: creditStorageProvider.id,
      },
    })

    const amount = parseUnits(fields.amount, fil.decimals).toString()

    // TODO: encrypt amount and other important info
    await prisma.$transaction(async tx => {
      if (!creditStorageProvider || !creditStorageProvider.id) {
        throw new Error('Failed to create or find storage provider')
      }

      let userCredit = existingUserCredit

      if (!userCredit) {
        userCredit = await tx.userCredit.create({
          data: {
            userId: fields.userId,
            storageProviderId: creditStorageProvider.id,
            amount,
          },
        })
      }

      await tx.creditTransaction.create({
        data: {
          from: fields.from,
          storageProviderId: creditStorageProvider.id,
          transactionHash: fields.hash,
          status: 'PENDING',
          amount,
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

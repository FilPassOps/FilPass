import prisma from 'lib/prisma'
import { saveTransferCreditsValidator } from './validation'
import { AppConfig } from 'config/system'
import { parseUnits } from 'ethers/lib/utils'
import { TransactionStatus } from '@prisma/client'
import { getContractsByUserId } from 'domain/contracts/get-contracts-by-user-id'

interface BuyCreditsParams {
  from: string
  to: string
  amount: string
  userId: number
  hash: string
  unit: string
  additionalTicketDays: number
}

export const buyCredits = async (props: BuyCreditsParams) => {
  try {
    const fields = await saveTransferCreditsValidator.validate(props)
    const { token } = AppConfig.network.getFilecoin()

    if (!token) {
      throw new Error('FIL token not found')
    }

    if (!validateAddress(fields.to)) {
      throw new Error('Invalid receiver address')
    }

    let creditReceiver = await prisma.receiver.findUnique({
      where: {
        walletAddress: fields.to.toLowerCase(),
      },
    })

    if (!creditReceiver) {
      creditReceiver = await prisma.receiver.create({
        data: {
          walletAddress: fields.to.toLowerCase(),
        },
      })
    }

    const { data: contracts, error: contractsError } = await getContractsByUserId({ userId: fields.userId })

    if (contractsError || !contracts) {
      throw new Error('Contracts not found')
    }

    const existingUserCredit = await prisma.userCredit.findFirst({
      where: {
        userId: fields.userId,
        receiverId: creditReceiver.id,
        contractId: contracts[0].id,
      },
    })

    const amount = parseUnits(fields.amount, token.decimals).toString()

    // TODO: encrypt amount and other important info
    await prisma.$transaction(async tx => {
      if (!creditReceiver || !creditReceiver.id) {
        throw new Error('Failed to create or find receiver')
      }

      let userCredit = existingUserCredit

      if (!userCredit) {
        userCredit = await tx.userCredit.create({
          data: {
            userId: fields.userId,
            receiverId: creditReceiver.id,
            contractId: contracts[0].id,
          },
        })
      }

      await tx.creditTransaction.create({
        data: {
          from: fields.from,
          receiverId: creditReceiver.id,
          transactionHash: fields.hash,
          status: TransactionStatus.PENDING,
          amount,
          userCreditId: userCredit.id,
          additionalTicketDays: fields.additionalTicketDays || Number(process.env.NEXT_PUBLIC_SUBMIT_TICKET_DAYS),
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

import { TransactionStatus } from '@prisma/client'
import { AppConfig } from 'config/index'
import { getUserByEmail } from 'domain/admin/get-user-by-email'
import { getContractsByUserId } from 'domain/contracts/get-contracts-by-user-id'
import { getUserCreditByReceiverWallet } from 'domain/transfer-credits/get-user-credit-by-receiver-wallet'
import { ethers } from 'ethers'
import prisma from 'lib/prisma'

import { FilPass__factory as FilPassFactory } from 'typechain-types'

type CheckTransactionParams = {
  hash: string
  email: string
  receiverWallet: string
  transactionType: 'REFUND' | 'SUBMIT_TICKET' | 'BUY_CREDIT'
}

const { network } = AppConfig.network.getFilecoin()

const contractInterface = FilPassFactory.createInterface()
const depositMadeEvent = contractInterface.getEvent('DepositMade')

export async function checkTransaction(params: CheckTransactionParams) {
  const { hash, email, transactionType, receiverWallet } = params

  console.log(params)

  const user = await getUserByEmail(email)

  if (!user) {
    throw new Error('User not found')
  }

  let userCredit = await getUserCreditByReceiverWallet({ receiverWallet, userId: user.id })

  if (transactionType === 'REFUND') {
    if (!userCredit || 'error' in userCredit) {
      throw new Error('User credit not found')
    }

    const existingRefund = await checkRefundTransaction(hash, user.id)

    if (existingRefund) {
      return null
    }

    const currentHeight = ethers.BigNumber.from(userCredit.totalRefunds).add(userCredit.totalSubmitTicket)
    const totalHeight = ethers.BigNumber.from(userCredit.totalHeight)
    const remainCredits = totalHeight.sub(currentHeight)

    await prisma.refundTransaction.create({
      data: {
        transactionHash: hash,
        status: TransactionStatus.PENDING,
        amount: remainCredits.toString(),
        userCreditId: userCredit.id,
      },
    })

    return {
      status: 'Success',
      message: 'Refund transaction created',
    }
  }

  if (transactionType === 'SUBMIT_TICKET') {
    const existingSubmitTicket = await checkTicketTransaction(hash, user.id)

    if (existingSubmitTicket) {
      return null
    }
  }

  if (transactionType === 'BUY_CREDIT') {
    const existingCredit = await checkCreditTransaction(hash, user.id)

    if (existingCredit) {
      return null
    }

    let creditReceiver = await prisma.receiver.findUnique({
      where: {
        walletAddress: receiverWallet.toLowerCase(),
      },
    })

    if (!creditReceiver) {
      creditReceiver = await prisma.receiver.create({
        data: {
          walletAddress: receiverWallet.toLowerCase(),
        },
      })
    }

    const { data: contracts, error: contractsError } = await getContractsByUserId({ userId: user.id })

    if (contractsError || !contracts) {
      throw new Error('Contracts not found')
    }

    const provider = new ethers.providers.JsonRpcProvider(network.rpcUrls[0])

    const receipt = await provider.getTransactionReceipt(hash)

    if (!receipt) {
      throw new Error('Transaction receipt not found')
    }

    if (receipt.status === 1) {
      receipt.logs.forEach(async log => {
        const parsed = contractInterface.parseLog(log)

        if (parsed.name !== depositMadeEvent.name) return

        const paidAmount = ethers.BigNumber.from(parsed.args.amount)
        const refundTime = ethers.BigNumber.from(parsed.args.refundTime)

        await prisma.$transaction(async tx => {
          if (!creditReceiver || !creditReceiver.id) {
            throw new Error('Failed to create or find receiver')
          }

          if (!userCredit || 'error' in userCredit) {
            userCredit = await tx.userCredit.create({
              data: {
                userId: user.id,
                receiverId: creditReceiver.id,
                contractId: contracts[0].id,
              },
            })
          }

          const currentRefundTime = userCredit.refundStartsAt ? new Date(userCredit.refundStartsAt).getTime() : 0
          const newRefundTime = refundTime.toNumber() * 1000 // Convert to milliseconds

          let additionalTicketDays = 0
          if (newRefundTime > currentRefundTime) {
            additionalTicketDays = (newRefundTime - currentRefundTime) / (24 * 60 * 60 * 1000) // Convert milliseconds to days
          }

          await tx.creditTransaction.create({
            data: {
              from: contracts[0].deployedFromAddress,
              receiverId: creditReceiver.id,
              transactionHash: hash,
              status: TransactionStatus.PENDING,
              amount: paidAmount.toString(),
              userCreditId: userCredit.id,
              additionalTicketDays: additionalTicketDays || Number(process.env.NEXT_PUBLIC_SUBMIT_TICKET_DAYS),
            },
          })
        })
      })
    }

    return {
      status: 'Success',
      message: 'Credit transaction created',
    }
  }

  return {
    status: 'Error',
    message: 'Invalid transaction type',
  }
}

async function checkRefundTransaction(hash: string, userId: number) {
  return await prisma.refundTransaction.findFirst({
    where: {
      transactionHash: hash,
      userCredit: {
        userId,
      },
    },
  })
}

async function checkTicketTransaction(hash: string, userId: number) {
  return await prisma.submitTicketTransaction.findFirst({
    where: { transactionHash: hash, userCredit: { userId } },
  })
}

async function checkCreditTransaction(hash: string, userId: number) {
  return await prisma.creditTransaction.findFirst({
    where: {
      transactionHash: hash,
      userCredit: {
        userId: userId,
      },
    },
  })
}

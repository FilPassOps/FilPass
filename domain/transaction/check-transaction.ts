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

  switch (transactionType) {
    case 'REFUND':
      return handleRefundTransaction(hash, user.id, receiverWallet)
    case 'SUBMIT_TICKET':
      return handleSubmitTicketTransaction(hash, user.id)
    case 'BUY_CREDIT':
      return handleBuyCreditTransaction(hash, user.id, receiverWallet)
    default:
      return {
        status: 'Error',
        message: 'Invalid transaction type',
      }
  }
}

async function handleRefundTransaction(hash: string, userId: number, receiverWallet: string) {
  const existingRefund = await checkRefundTransaction(hash, userId)
  if (existingRefund) {
    return null
  }

  const userCredit = await getUserCreditByReceiverWallet({ receiverWallet, userId })
  if (!userCredit || 'error' in userCredit) {
    throw new Error('User credit not found')
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

async function handleSubmitTicketTransaction(hash: string, userId: number) {
  const existingSubmitTicket = await checkTicketTransaction(hash, userId)
  if (existingSubmitTicket) {
    return null
  }

  return {
    status: 'Success',
    message: 'Submit ticket transaction checked',
  }
}

async function handleBuyCreditTransaction(hash: string, userId: number, receiverWallet: string) {
  const existingCredit = await checkCreditTransaction(hash, userId)
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

  const { data: contracts, error: contractsError } = await getContractsByUserId({ userId })
  if (contractsError || !contracts) {
    throw new Error('Contracts not found')
  }

  const provider = new ethers.providers.JsonRpcProvider(network.rpcUrls[0])
  const receipt = await provider.getTransactionReceipt(hash)

  if (!receipt) {
    throw new Error('Transaction receipt not found')
  }

  if (receipt.status === 1) {
    await processTransactionLogs(receipt.logs, contracts[0], userId, creditReceiver, hash)
  }

  return {
    status: 'Success',
    message: 'Credit transaction created',
  }
}

async function processTransactionLogs(logs: ethers.providers.Log[], contract: any, userId: number, creditReceiver: any, hash: string) {
  for (const log of logs) {
    const parsed = contractInterface.parseLog(log)
    if (parsed.name !== depositMadeEvent.name) continue

    const paidAmount = ethers.BigNumber.from(parsed.args.amount)
    const refundTime = ethers.BigNumber.from(parsed.args.refundTime)

    await prisma.$transaction(async tx => {
      if (!creditReceiver || !creditReceiver.id) {
        throw new Error('Failed to create or find receiver')
      }

      let userCredit = await getUserCreditByReceiverWallet({
        receiverWallet: creditReceiver.walletAddress,
        userId,
      })

      if (!userCredit || 'error' in userCredit) {
        userCredit = await tx.userCredit.create({
          data: {
            userId,
            receiverId: creditReceiver.id,
            contractId: contract.id,
          },
        })
      }

      const currentRefundTime = userCredit.refundStartsAt ? new Date(userCredit.refundStartsAt).getTime() : 0
      const newRefundTime = refundTime.toNumber() * 1000

      let additionalTicketDays = 0
      if (newRefundTime > currentRefundTime) {
        additionalTicketDays = (newRefundTime - currentRefundTime) / (24 * 60 * 60 * 1000)
      }

      await tx.creditTransaction.create({
        data: {
          from: contract.deployedFromAddress,
          receiverId: creditReceiver.id,
          transactionHash: hash,
          status: TransactionStatus.PENDING,
          amount: paidAmount.toString(),
          userCreditId: userCredit.id,
          additionalTicketDays: additionalTicketDays || Number(process.env.NEXT_PUBLIC_SUBMIT_TICKET_DAYS),
        },
      })
    })
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

import { CreditTicketStatus, LedgerType, Prisma, TransactionStatus } from '@prisma/client'
import { AppConfig } from 'config/system'
import { ethers } from 'ethers'
import prisma from 'lib/prisma'
import { FilecoinDepositWithdrawRefund__factory as FilecoinDepositWithdrawRefundFactory } from 'typechain-types'

const contractInterface = FilecoinDepositWithdrawRefundFactory.createInterface()
const withdrawMadeEvent = contractInterface.getEvent('WithdrawalMade')

const { network, token } = AppConfig.network.getFilecoin()

export default async function run() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    const pendingTransactions = await prisma.withdrawTransaction.findMany({
      where: {
        status: TransactionStatus.PENDING,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      select: {
        id: true,
        transactionHash: true,
        amount: true,
        creditTicket: {
          select: {
            height: true,
            id: true,
          },
        },
        userCredit: {
          select: {
            id: true,
            refundStartsAt: true,
            withdrawStartsAt: true,
            withdrawExpiresAt: true,
            totalHeight: true,
          },
        },
      },
      take: 10,
      distinct: ['transactionHash'],
    })

    if (pendingTransactions.length <= 0) {
      return
    }

    if (!token.decimals) {
      console.error('FIL decimals not found')
      return
    }

    const provider = new ethers.providers.JsonRpcProvider(network.rpcUrls[0])

    for await (const { transactionHash, userCredit, creditTicket, id } of pendingTransactions) {
      if (!transactionHash || !userCredit || !userCredit.id) {
        continue
      }

      const receipt = await provider.getTransactionReceipt(transactionHash)

      if (!receipt) {
        continue
      }

      if (receipt.status === 1) {
        receipt.logs.forEach(async log => {
          const parsed = contractInterface.parseLog(log)

          if (parsed.name !== withdrawMadeEvent.name) return

          await prisma.$transaction(
            async tx => {
              const txCreditTicket = await tx.creditTicket.findUnique({
                include: {
                  ticketGroup: {
                    include: {
                      userCredit: true,
                    },
                  },
                },
                where: {
                  status: CreditTicketStatus.VALID,
                  id: creditTicket.id,
                },
              })

              if (!txCreditTicket) {
                return
              }

              const currentHeight = ethers.BigNumber.from(txCreditTicket.ticketGroup.userCredit.totalWithdrawals).add(
                txCreditTicket.ticketGroup.userCredit.totalRefunds,
              )
              const ticketAmount = ethers.BigNumber.from(txCreditTicket.height).sub(currentHeight)
              const amount = ethers.BigNumber.from(txCreditTicket.ticketGroup.userCredit.amount).sub(ticketAmount)

              await tx.ledger.create({
                data: {
                  userCreditId: txCreditTicket.ticketGroup.userCredit.id,
                  amount: ticketAmount.toString(),
                  type: LedgerType.WITHDRAWAL,
                },
              })

              const totalWithdrawals = ethers.BigNumber.from(txCreditTicket.ticketGroup.userCredit.totalWithdrawals).add(ticketAmount)

              await tx.userCredit.update({
                where: {
                  id: txCreditTicket.ticketGroup.userCredit.id,
                },
                data: {
                  amount: amount.toString(),
                  totalWithdrawals: totalWithdrawals.toString(),
                },
              })

              await tx.creditTicket.update({
                where: {
                  id: txCreditTicket.id,
                },
                data: {
                  status: CreditTicketStatus.REDEEMED,
                },
              })

              await tx.creditTicket.updateMany({
                where: {
                  approximatedHeight: { lte: txCreditTicket.approximatedHeight },
                  ticketGroup: {
                    userCreditId: txCreditTicket.ticketGroup.userCreditId,
                  },
                  status: CreditTicketStatus.VALID,
                },
                data: {
                  status: CreditTicketStatus.INVALID,
                },
              })

              await tx.withdrawTransaction.update({
                where: {
                  id,
                },
                data: {
                  status: TransactionStatus.SUCCESS,
                  confirmations: receipt.confirmations,
                  blockNumber: receipt.blockNumber.toString(),
                },
              })
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
          )
        })
        console.log('Withdraw made successfully with transaction hash', transactionHash)
      } else {
        await prisma.withdrawTransaction.update({
          where: {
            transactionHash,
          },
          data: {
            status: TransactionStatus.FAILED,
            failReason: `Transaction failed with the following receipt status: ${receipt.status}`,
          },
        })
        console.log('Withdraw made failed with transaction hash', transactionHash)
      }
    }
  } catch (error) {
    console.log('Error checking pending transactions', error)
  }
}

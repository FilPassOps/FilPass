import { CreditTicketStatus, LedgerType, Prisma, TransactionStatus } from '@prisma/client'
import { AppConfig } from 'config/system'
import { ethers } from 'ethers'
import prisma from 'lib/prisma'
import { FilPass__factory as FilPassFactory } from 'typechain-types'

const contractInterface = FilPassFactory.createInterface()
const refundMadeEvent = contractInterface.getEvent('RefundMade')

const { network, token } = AppConfig.network.getFilecoin()

export default async function run() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    const pendingTransactions = await prisma.refundTransaction.findMany({
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
        userCredit: {
          select: {
            id: true,
            refundStartsAt: true,
            submitTicketStartsAt: true,
            submitTicketExpiresAt: true,
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

    for await (const { transactionHash, userCredit, id } of pendingTransactions) {
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

          if (parsed.name !== refundMadeEvent.name) return

          const { amount } = parsed.args

          const refundAmount = ethers.BigNumber.from(amount)

          await prisma.$transaction(
            async tx => {
              await tx.ledger.create({
                data: {
                  userCreditId: userCredit.id,
                  amount: refundAmount.toString(),
                  type: LedgerType.REFUND,
                },
              })

              const txUserCredit = await tx.userCredit.findUnique({
                where: {
                  id: userCredit.id,
                },
              })

              if (!txUserCredit) {
                return
              }

              await tx.refundTransaction.update({
                where: {
                  id,
                },
                data: {
                  status: TransactionStatus.SUCCESS,
                  confirmations: receipt.confirmations,
                  blockNumber: receipt.blockNumber.toString(),
                },
              })

              const currentHeight = ethers.BigNumber.from(txUserCredit.totalRefunds).add(txUserCredit.totalSubmitTicket)
              const totalHeight = ethers.BigNumber.from(txUserCredit.totalHeight)
              const remainCredits = totalHeight.sub(currentHeight)
              const totalRefunds = remainCredits.add(txUserCredit.totalRefunds).toString()

              await tx.userCredit.update({
                where: {
                  id: txUserCredit.id,
                },
                data: {
                  totalRefunds,
                  amount: '0',
                  totalHeight: totalHeight.toString(),
                },
              })

              // TODO: check if delete the tickets and the group

              await tx.creditTicket.updateMany({
                where: {
                  ticketGroup: {
                    userCreditId: txUserCredit.id,
                  },
                  status: CreditTicketStatus.VALID,
                },
                data: {
                  status: CreditTicketStatus.REFUNDED,
                },
              })
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
          )
        })
        console.log('Refund made successfully with transaction hash', transactionHash)
      } else {
        await prisma.refundTransaction.update({
          where: {
            transactionHash,
          },
          data: {
            status: TransactionStatus.FAILED,
            failReason: `Transaction failed with the following receipt status: ${receipt.status}`,
          },
        })
        console.log('Refund made failed with transaction hash', transactionHash)
      }
    }
  } catch (error) {
    console.log('Error checking pending transactions', error)
  }
}

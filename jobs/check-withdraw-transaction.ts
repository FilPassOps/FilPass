import { LedgerType, Prisma, TransactionStatus } from '@prisma/client'
import { AppConfig } from 'config/system'
import { ethers } from 'ethers'
import prisma from 'lib/prisma'
import { FilecoinDepositWithdrawRefund__factory as FilecoinDepositWithdrawRefundFactory } from 'typechain-types'

const contractInterface = FilecoinDepositWithdrawRefundFactory.createInterface()
const withdrawMadeEvent = contractInterface.getEvent('WithdrawalMade')

const chain = AppConfig.network.getChainByName('Filecoin')
const filDecimals = chain.tokens.find(t => t.symbol === 'tFIL')?.decimals

export default async function run() {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    const pendingTransactions = await prisma.withdrawTransaction.findMany({
      where: {
        status: TransactionStatus.PENDING,
        createdAt: {
          gte: twentyFourHoursAgo,
          // lte: fifteenMinutesAgo,
        },
      },
      select: {
        id: true,
        transactionHash: true,
        amount: true,
        creditToken: {
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

    if (!filDecimals) {
      console.error('FIL decimals not found')
      return
    }

    const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])

    // TODO: check if transaction is pending

    for await (const { transactionHash, userCredit, creditToken, id } of pendingTransactions) {
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

          // const paidAmount = ethers.BigNumber.from(parsed.args.amount)

          await prisma.$transaction(
            async tx => {
              const txCreditToken = await tx.creditToken.findUnique({
                include: {
                  splitGroup: {
                    include: {
                      userCredit: true,
                    },
                  },
                },
                where: {
                  redeemable: true,
                  id: creditToken.id,
                },
              })

              if (!txCreditToken) {
                return
              }

              const currentHeight = ethers.BigNumber.from(txCreditToken.splitGroup.userCredit.totalWithdrawals).add(
                txCreditToken.splitGroup.userCredit.totalRefunds,
              )
              const tokenAmount = ethers.BigNumber.from(txCreditToken.height).sub(currentHeight)
              const amount = ethers.BigNumber.from(txCreditToken.splitGroup.userCredit.amount).sub(tokenAmount)

              await tx.ledger.create({
                data: {
                  userCreditId: txCreditToken.splitGroup.userCredit.id,
                  amount: tokenAmount.toString(),
                  type: LedgerType.WITHDRAWAL,
                },
              })

              const totalWithdrawals = ethers.BigNumber.from(txCreditToken.splitGroup.userCredit.totalWithdrawals).add(tokenAmount)

              await tx.userCredit.update({
                where: {
                  id: txCreditToken.splitGroup.userCredit.id,
                },
                data: {
                  amount: amount.toString(),
                  totalWithdrawals: totalWithdrawals.toString(),
                },
              })

              await tx.creditToken.update({
                where: {
                  id: txCreditToken.id,
                },
                data: {
                  redeemable: false,
                },
              })

              await tx.creditToken.updateMany({
                where: {
                  id: { lt: txCreditToken.id },
                  splitGroupId: txCreditToken.splitGroup.id,
                  redeemable: true,
                },
                data: {
                  valid: false,
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

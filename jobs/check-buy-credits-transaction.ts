import { LedgerType, Prisma, TransactionStatus } from '@prisma/client'
import { AppConfig } from 'config/system'
import { ethers } from 'ethers'
import prisma from 'lib/prisma'
import { FilecoinDepositWithdrawRefund__factory as FilecoinDepositWithdrawRefundFactory } from 'typechain-types'

// 45 days
const WITHDRAW_DAYS_TIME = 45 * 24 * 60 * 60 * 1000

// 1 day
const LOCK_DAYS_TIME = 1 * 24 * 60 * 60 * 1000

const ONE_DAY_TIME = 1 * 24 * 60 * 60 * 1000

const contractInterface = FilecoinDepositWithdrawRefundFactory.createInterface()
const depositMadeEvent = contractInterface.getEvent('DepositMade')

const chain = AppConfig.network.getChainByName('Filecoin')
const filDecimals = chain.tokens.find(t => t.symbol === 'tFIL')?.decimals

export default async function run() {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    const pendingTransactions = await prisma.creditTransaction.findMany({
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

    for await (const { transactionHash, userCredit, id, amount } of pendingTransactions) {
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

          if (parsed.name !== depositMadeEvent.name) return

          const paidAmount = ethers.BigNumber.from(parsed.args.amount)

          if (!paidAmount.eq(amount)) {
            await prisma.creditTransaction.update({
              where: {
                id,
              },
              data: {
                status: TransactionStatus.FAILED,
                confirmations: receipt.confirmations,
                blockNumber: receipt.blockNumber.toString(),
                failReason: `Token amount mismatch: expected ${amount.toString()}, got ${paidAmount.toString()}`,
              },
            })
            return
          }

          await prisma.$transaction(
            async tx => {
              await tx.ledger.create({
                data: {
                  userCreditId: userCredit.id,
                  amount: paidAmount.toString(),
                  type: LedgerType.DEPOSIT,
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

              let withdrawStartsAt: Date | undefined
              let withdrawExpiresAt: Date | undefined
              let refundStartsAt: Date | undefined

              const amount = txUserCredit.amount ? paidAmount.add(txUserCredit.amount).toString() : paidAmount.toString()

              const totalHeight = txUserCredit.totalHeight ? paidAmount.add(txUserCredit.totalHeight).toString() : paidAmount.toString()

              const fistCredits = !txUserCredit.withdrawStartsAt
              const expiredCredit = txUserCredit.refundStartsAt && new Date() >= txUserCredit.refundStartsAt

              if (fistCredits || expiredCredit) {
                withdrawStartsAt = new Date()
                withdrawExpiresAt = new Date(withdrawStartsAt.getTime() + WITHDRAW_DAYS_TIME)
                refundStartsAt = new Date(withdrawExpiresAt.getTime() + LOCK_DAYS_TIME + ONE_DAY_TIME)
              } else {
                withdrawStartsAt = userCredit.withdrawStartsAt!
                withdrawExpiresAt = new Date(userCredit.withdrawExpiresAt!.getTime() + WITHDRAW_DAYS_TIME)
                refundStartsAt = new Date(withdrawExpiresAt.getTime() + ONE_DAY_TIME)
              }

              await tx.creditTransaction.update({
                where: {
                  id,
                },
                data: {
                  status: TransactionStatus.SUCCESS,
                  confirmations: receipt.confirmations,
                  blockNumber: receipt.blockNumber.toString(),
                },
              })

              await tx.userCredit.update({
                where: {
                  id: txUserCredit.id,
                },
                data: {
                  totalHeight,
                  withdrawStartsAt,
                  withdrawExpiresAt,
                  refundStartsAt,
                  amount,
                },
              })
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
          )
        })

        console.log('Deposit made successfully with transaction hash', transactionHash)
      } else {
        await prisma.creditTransaction.update({
          where: {
            transactionHash,
          },
          data: {
            status: TransactionStatus.FAILED,
            failReason: `Transaction failed with the following receipt status: ${receipt.status}`,
          },
        })
        console.log('Deposit made failed with transaction hash', transactionHash)
      }
    }
  } catch (error) {
    console.log('Error checking pending transactions', error)
  }
}

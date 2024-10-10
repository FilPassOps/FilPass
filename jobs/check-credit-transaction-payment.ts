import { AppConfig } from 'config/system'
import { randomUUID } from 'crypto'
import { ethers } from 'ethers'
import { signJwt } from 'lib/jwt'
import prisma from 'lib/prisma'

// 30 days
const WITHDRAW_DAYS_TIME = 30 * 24 * 60 * 60 * 1000

// 1 day
const LOCK_DAYS_TIME = 1 * 24 * 60 * 60 * 1000

const ONE_DAY_TIME = 1 * 24 * 60 * 60 * 1000

export default async function run() {
  try {
    const pendingTransactions = await prisma.creditTransaction.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lte: new Date(new Date().getTime() + 1440 * 60 * 1000), // 24 hours
        },
      },
      select: {
        id: true,
        transactionHash: true,
        userCredit: {
          select: {
            id: true,
            amount: true,
            refundStartsAt: true,
            withdrawStartsAt: true,
            withdrawExpiresAt: true,
            totalHeight: true,
          },
        },
      },
      distinct: ['transactionHash'],
    })

    if (pendingTransactions.length <= 0) {
      return
    }

    const chain = AppConfig.network.getChainByName('Filecoin')
    const filDecimals = chain.tokens.find(t => t.symbol === 'tFIL')?.decimals

    // TODO: change when using the contract
    const etherChain = AppConfig.network.getChainByName('Ethereum')

    if (!filDecimals) {
      console.error('FIL decimals not found')
      return
    }

    const provider = new ethers.providers.JsonRpcProvider(etherChain.rpcUrls[0])

    for await (const { transactionHash, userCredit, id } of pendingTransactions) {
      if (!transactionHash || !userCredit || !userCredit.id) {
        continue
      }

      const receipt = await provider.getTransactionReceipt(transactionHash)

      if (!receipt) {
        continue
      }

      if (receipt.status === 1) {
        const paidAmount = ethers.BigNumber.from(receipt.logs[0].data)

        // TODO: uncomment after using the contract
        // if (!paidAmount.eq(userCredit.amount)) {
        //   await prisma.creditTransaction.update({
        //     where: {
        //       id,
        //     },
        //     data: {
        //       status: 'FAILED',
        //     },
        //   })
        // }

        let withdrawStartsAt: Date | undefined
        let withdrawExpiresAt: Date | undefined
        let refundStartsAt: Date | undefined

        const totalHeight = userCredit.totalHeight ? paidAmount.add(userCredit.totalHeight).toString() : paidAmount.toString()

        const fistCredits = !userCredit.withdrawStartsAt
        const expiredCredit = userCredit.refundStartsAt && new Date() >= userCredit.refundStartsAt

        if (fistCredits || expiredCredit) {
          withdrawStartsAt = new Date()
          withdrawExpiresAt = new Date(withdrawStartsAt.getTime() + WITHDRAW_DAYS_TIME)
          refundStartsAt = new Date(withdrawExpiresAt.getTime() + LOCK_DAYS_TIME + ONE_DAY_TIME)
        } else {
          withdrawStartsAt = userCredit.withdrawStartsAt!
          withdrawExpiresAt = new Date(userCredit.withdrawExpiresAt!.getTime() + WITHDRAW_DAYS_TIME)
          refundStartsAt = new Date(withdrawExpiresAt.getTime() + ONE_DAY_TIME)
        }

        await prisma.$transaction(async tx => {
          await tx.creditTransaction.update({
            where: {
              id,
            },
            data: {
              status: 'SUCCESS',
            },
          })
          const tokenUuid = randomUUID()
          const creditToken = await tx.creditToken.create({
            data: {
              userCreditId: userCredit.id,
              height: totalHeight,
              amount: totalHeight,
              publicId: tokenUuid,
              token: await signJwt({
                iss: process.env.SYSTEM_WALLET_ADDRESS,
                exp: withdrawExpiresAt?.getTime(),
                iat: withdrawStartsAt?.getTime(),
                sub: tokenUuid,
                height: totalHeight,
              }),
              redeemable: true,
            },
          })
          await tx.userCredit.update({
            where: {
              id: userCredit.id,
            },
            data: {
              totalHeight,
              currentTokenId: creditToken.id,
              withdrawStartsAt,
              withdrawExpiresAt,
              refundStartsAt,
            },
          })
        })
      } else {
        await prisma.creditTransaction.update({
          where: {
            transactionHash,
          },
          data: {
            status: 'FAILED',
          },
        })
      }
    }
  } catch (error) {
    console.log('Error checking pending transactions', error)
  }
}

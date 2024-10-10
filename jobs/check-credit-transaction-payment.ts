import Big from 'big.js'
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

    const chain = AppConfig.network.getChainByName('Ethereum')
    const usdcDecimals = chain.tokens.find(t => t.symbol === 'USDC')?.decimals

    if (!usdcDecimals) {
      console.error('USDC decimals not found')
      return
    }

    const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])

    for await (const { transactionHash, userCredit, id } of pendingTransactions) {
      if (!transactionHash || !userCredit || !userCredit.id) {
        continue
      }

      const receipt = await provider.getTransactionReceipt(transactionHash)

      if (!receipt) {
        continue
      }

      if (receipt.status === 1) {
        // TODO: change to correct to use on balance and height
        const formattedPaidUsdcAmount = ethers.utils.formatUnits(receipt.logs[0].data, usdcDecimals)
        // const normalizedOfferPrice = ethers.utils.formatUnits(userCredit.offerPrice, usdcDecimals)

        // console.log('formattedPaidUsdcAmount', formattedPaidUsdcAmount)
        // console.log('normalizedOfferPrice', normalizedOfferPrice)
        // console.log('receipt.logs[0].data', receipt.logs[0].data)

        // TODO: check the decimals
        // if (formattedPaidUsdcAmount !== userCredit.offerPrice) {
        //   await prisma.creditTransaction.update({
        //     where: {
        //       id,
        //     },
        //     data: {
        //       status: 'FAILED',
        //     },
        //   })
        //   continue
        // }

        let withdrawStartsAt: Date | undefined
        let withdrawExpiresAt: Date | undefined
        let refundStartsAt: Date | undefined

        const totalHeight = userCredit.totalHeight
          ? Big(userCredit.totalHeight).plus(formattedPaidUsdcAmount).toString()
          : Big(formattedPaidUsdcAmount).toString()

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

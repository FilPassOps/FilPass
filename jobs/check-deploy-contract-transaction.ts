import { Prisma, TransactionStatus } from '@prisma/client'
import { AppConfig } from 'config/system'
import { ethers } from 'ethers'
import prisma from 'lib/prisma'

const chain = AppConfig.network.getChainByName('Filecoin')

export default async function run() {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    const pendingTransactions = await prisma.deployContractTransaction.findMany({
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
        userId: true,
        walletAddress: true,
      },
      take: 10,
      distinct: ['transactionHash'],
    })

    if (pendingTransactions.length <= 0) {
      return
    }

    const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])

    for await (const { transactionHash, id, userId, walletAddress } of pendingTransactions) {
      if (!transactionHash) {
        continue
      }

      const receipt = await provider.getTransactionReceipt(transactionHash)

      if (!receipt) {
        continue
      }

      if (receipt.status === 1) {
        const contractAddress = receipt.contractAddress

        if (!contractAddress) {
          console.log(`Contract address not found for transaction ${transactionHash}`)
          continue
        }

        await prisma.$transaction(
          async tx => {
            await tx.deployContractTransaction.update({
              where: { id },
              data: {
                status: TransactionStatus.SUCCESS,
                confirmations: receipt.confirmations,
                blockNumber: receipt.blockNumber.toString(),
              },
            })

            await tx.contract.create({
              data: {
                address: contractAddress,
                userId: userId,
                deployedFromAddress: walletAddress,
                transactionId: id,
              },
            })
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        )

        console.log(`Contract deployed successfully at ${contractAddress}`)
      } else {
        await prisma.deployContractTransaction.update({
          where: { id },
          data: {
            status: TransactionStatus.FAILED,
            failReason: 'Contract deployment transaction failed',
          },
        })

        console.log(`Contract deployment failed for transaction ${transactionHash}`)
      }
    }
  } catch (error) {
    console.log('Error checking pending transactions', error)
  }
}

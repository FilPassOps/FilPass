import prisma from 'lib/prisma'
import { verify } from 'lib/jwt'
import { redeemTokenValidator } from './validation'
import { ethers } from 'ethers'
import { TransactionStatus } from '@prisma/client'
import { FilecoinDepositWithdrawRefund__factory as FilecoinDepositWithdrawRefundFactory } from 'typechain-types'
import { getPaymentErrorMessage } from 'components/Web3/utils'
import { getContractsByUserId } from 'domain/contracts/get-contracts-by-user-id'
import { AppConfig } from 'config/system'

interface RedeemTokenParams {
  walletAddress: string
  token: string
}

interface RedeemTokenResult {
  message?: string
  error?: string
}

export const redeemToken = async (props: RedeemTokenParams): Promise<RedeemTokenResult> => {
  try {
    const fields = await redeemTokenValidator.validate(props)

    const chain = AppConfig.network.getChainByName('Filecoin')

    // mark redeemed as soon as possible

    const result = verify(fields.token, process.env.PUBLIC_KEY as string)

    if (!result.data.jti) {
      throw new Error('Invalid token', { cause: 'INVALID' })
    }

    const storageProvider = await prisma.storageProvider.findUnique({
      where: {
        walletAddress: fields.walletAddress,
      },
    })

    if (!storageProvider) {
      throw new Error('Storage provider not found', { cause: 'INVALID' })
    }

    const creditToken = await prisma.creditToken.findUnique({
      include: {
        userCredit: true,
      },
      where: {
        publicId: result.data.jti,
      },
    })

    if (!creditToken) {
      throw new Error('Credit token not found', { cause: 'INVALID' })
    }

    if (!creditToken.redeemable) {
      throw new Error('Credit token already redeemed', { cause: 'INVALID' })
    }

    if (creditToken.userCredit.withdrawExpiresAt! < new Date()) {
      throw new Error('Withdrawal expired', { cause: 'INVALID' })
    }

    const { data: contracts, error: contractsError } = await getContractsByUserId({ userId: creditToken.userCredit.userId })

    if (contractsError || !contracts) {
      throw new Error('Contracts not found')
    }

    const currentHeight = ethers.BigNumber.from(creditToken.userCredit.totalWithdrawals).add(creditToken.userCredit.totalRefunds)

    if (currentHeight.gte(creditToken.height)) {
      throw new Error('A bigger token was already redeemed', { cause: 'INVALID' })
    }

    const tokenAmount = ethers.BigNumber.from(creditToken.height).sub(currentHeight)

    const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])

    const wallet = new ethers.Wallet(process.env.SYSTEM_WALLET_PRIVATE_KEY as string, provider)

    const filpass = new ethers.Contract(contracts[0].address, FilecoinDepositWithdrawRefundFactory.abi, wallet)

    const transaction = await filpass.withdrawAmount(storageProvider.walletAddress, tokenAmount.toString())

    await prisma.withdrawTransaction.create({
      data: {
        creditTokenId: creditToken.id,
        transactionHash: transaction.hash,
        amount: tokenAmount.toString(),
        userCreditId: creditToken.userCreditId,
        status: TransactionStatus.PENDING,
      },
    })

    return { message: 'Success' }
  } catch (error) {
    console.log(getPaymentErrorMessage(error as Error))

    if (error instanceof Error && error.cause === 'INVALID') {
      return { error: error.message }
    }
    return { error: 'Something went wrong' }
  }
}

import prisma from 'lib/prisma'
import { verify } from 'lib/jwt'
import { submitTicketValidator } from './validation'
import { ethers } from 'ethers'
import { TransactionStatus } from '@prisma/client'
import { FilecoinDepositWithdrawRefund__factory as FilecoinDepositWithdrawRefundFactory } from 'typechain-types'
import { getPaymentErrorMessage } from 'components/Web3/utils'
import { getContractsByUserId } from 'domain/contracts/get-contracts-by-user-id'
import { AppConfig } from 'config/system'

interface SubmitTicketParams {
  token: string
}

interface SubmitTicketResult {
  message?: string
  error?: string
}

export const submitTicket = async (props: SubmitTicketParams): Promise<SubmitTicketResult> => {
  try {
    const fields = await submitTicketValidator.validate(props)

    const chain = AppConfig.network.getChainByName('Filecoin')

    const result = verify(fields.token, process.env.PUBLIC_KEY as string)

    if (!result.data.jti || !result.data.aud) {
      throw new Error('Invalid token', { cause: 'INVALID' })
    }

    const storageProvider = await prisma.storageProvider.findUnique({
      where: {
        walletAddress: result.data.aud,
      },
    })

    if (!storageProvider) {
      throw new Error('Storage provider not found', { cause: 'INVALID' })
    }

    const creditTicket = await prisma.creditTicket.findUnique({
      include: {
        splitGroup: {
          include: {
            userCredit: true,
          },
        },
      },
      where: {
        publicId: result.data.jti,
      },
    })

    if (!creditTicket) {
      throw new Error('Credit ticket not found', { cause: 'INVALID' })
    }

    if (!creditTicket.redeemable) {
      throw new Error('Credit ticket already redeemed', { cause: 'INVALID' })
    }

    if (creditTicket.splitGroup.userCredit.withdrawExpiresAt! < new Date()) {
      throw new Error('Withdrawal expired', { cause: 'INVALID' })
    }

    const { data: contracts, error: contractsError } = await getContractsByUserId({
      userId: creditTicket.splitGroup.userCredit.userId,
    })

    if (contractsError || !contracts) {
      throw new Error('Contracts not found')
    }

    const currentHeight = ethers.BigNumber.from(creditTicket.splitGroup.userCredit.totalWithdrawals).add(
      creditTicket.splitGroup.userCredit.totalRefunds,
    )

    if (currentHeight.gte(creditTicket.height)) {
      throw new Error('A bigger ticket was already redeemed', { cause: 'INVALID' })
    }

    const tokenAmount = ethers.BigNumber.from(creditTicket.height).sub(currentHeight)

    const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])

    const wallet = new ethers.Wallet(process.env.SYSTEM_WALLET_PRIVATE_KEY as string, provider)

    const filpass = new ethers.Contract(contracts[0].address, FilecoinDepositWithdrawRefundFactory.abi, wallet)

    const transaction = await filpass.withdrawAmount(storageProvider.walletAddress, tokenAmount.toString())

    await prisma.withdrawTransaction.create({
      data: {
        creditTicketId: creditTicket.id,
        transactionHash: transaction.hash,
        amount: tokenAmount.toString(),
        userCreditId: creditTicket.splitGroup.userCreditId,
        status: TransactionStatus.PENDING,
      },
    })

    return { message: 'Success' }
  } catch (error) {
    if (error instanceof Error && error.cause === 'INVALID') {
      return { error: error.message }
    }
    return { error: 'Something went wrong' }
  }
}

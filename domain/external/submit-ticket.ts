import prisma from 'lib/prisma'
import { verify } from 'lib/jwt'
import { submitTicketValidator } from './validation'
import { ethers } from 'ethers'
import { CreditTicketStatus, TransactionStatus } from '@prisma/client'
import { FilecoinDepositWithdrawRefund__factory as FilecoinDepositWithdrawRefundFactory } from 'typechain-types'
import { getContractsByUserId } from 'domain/contracts/get-contracts-by-user-id'
import { AppConfig } from 'config/system'
import { getPaymentErrorMessage } from 'components/Web3/utils'

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
        ticketGroup: {
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

    if (creditTicket.ticketGroup.expiresAt! < new Date() || creditTicket.ticketGroup.userCredit.withdrawExpiresAt! < new Date()) {
      throw new Error('Withdrawal expired', { cause: 'INVALID' })
    }

    if (creditTicket.status !== CreditTicketStatus.VALID) {
      throw new Error('Credit ticket cannot be redeemed', { cause: 'INVALID' })
    }

    const { data: contracts, error: contractsError } = await getContractsByUserId({
      userId: creditTicket.ticketGroup.userCredit.userId,
    })

    if (contractsError || !contracts) {
      throw new Error('Contracts not found')
    }

    const currentHeight = ethers.BigNumber.from(creditTicket.ticketGroup.userCredit.totalWithdrawals).add(
      creditTicket.ticketGroup.userCredit.totalRefunds,
    )

    if (currentHeight.gte(creditTicket.height)) {
      throw new Error('A bigger ticket was already redeemed', { cause: 'INVALID' })
    }

    const tokenAmount = ethers.BigNumber.from(creditTicket.height).sub(currentHeight)

    const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])

    const wallet = new ethers.Wallet(process.env.SYSTEM_WALLET_PRIVATE_KEY as string, provider)

    const filpass = FilecoinDepositWithdrawRefundFactory.connect(contracts[0].address, wallet)

    const transaction = await filpass.withdrawAmount(result.data)

    await prisma.withdrawTransaction.create({
      data: {
        creditTicketId: creditTicket.id,
        transactionHash: transaction.hash,
        amount: tokenAmount.toString(),
        userCreditId: creditTicket.ticketGroup.userCreditId,
        status: TransactionStatus.PENDING,
      },
    })

    return { message: 'Success' }
  } catch (error) {
    console.log('error', getPaymentErrorMessage(error))
    if (error instanceof Error && error.cause === 'INVALID') {
      return { error: error.message }
    }
    return { error: 'Something went wrong' }
  }
}

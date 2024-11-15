import prisma from 'lib/prisma'
import { verify } from 'lib/jwt'
import { submitTicketValidator } from './validation'
import { ethers } from 'ethers'
import { CreditTicketStatus, TransactionStatus } from '@prisma/client'
import { FilPass__factory as FilPassFactory } from 'typechain-types'
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

const temporaryTestPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr5Rsblt8pjtnV0yyw0yS
UUlnCKWC2kBNDFlz30v5AFVytoCulh/ntbB4G4tEOXqnVFBq1CrTH0g2EahvN1SZ
TbavlaDCryZODPam2bHy0jH/Unm2sgJx4+xdVYjIlFhZRGoU+A1MuskAsElD8mFe
fWEEVIK3TUqiGny+kLmEtXUDJGhJkYilhXeMKJbVDgZhJuCsLLgWFv3gmfRA749V
NWMBEqmEUR+G//NYXoumeFH8hkli1Q7lwx/tu7f9eHbEwfT9NeWXGT1uwer16aXT
MMIhcZbfAzEKp+0d093OGMsHuTVRfM5xy38+1TD+yQ5AvEsR0LMapDt89A3SDiaX
KwIDAQAB
-----END PUBLIC KEY-----`

export const submitTicket = async (props: SubmitTicketParams): Promise<SubmitTicketResult> => {
  try {
    const fields = await submitTicketValidator.validate(props)

    const { network } = AppConfig.network.getFilecoin()

    const result = verify(fields.token, temporaryTestPublicKey as string)

    if (!result.data.jti || !result.data.aud) {
      throw new Error('Invalid token', { cause: 'INVALID' })
    }

    const receiver = await prisma.receiver.findUnique({
      where: {
        walletAddress: result.data.aud,
      },
    })

    if (!receiver) {
      throw new Error('Receiver not found', { cause: 'INVALID' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const submitTicketTransactionCount = await prisma.submitTicketTransaction.count({
      where: {
        userCredit: {
          receiverId: receiver.id,
        },
        createdAt: {
          gte: today,
        },
      },
    })

    if (submitTicketTransactionCount >= parseInt(process.env.SUBMIT_TICKET_TRANSACTION_LIMIT as string)) {
      throw new Error('Submit ticket transaction limit exceeded for today', { cause: 'INVALID' })
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

    if (creditTicket.ticketGroup.expiresAt! < new Date() || creditTicket.ticketGroup.userCredit.submitTicketExpiresAt! < new Date()) {
      throw new Error('Submit ticket expired', { cause: 'INVALID' })
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

    const currentHeight = ethers.BigNumber.from(creditTicket.ticketGroup.userCredit.totalSubmitTicket).add(
      creditTicket.ticketGroup.userCredit.totalRefunds,
    )

    if (currentHeight.gte(creditTicket.height)) {
      throw new Error('A bigger ticket was already redeemed', { cause: 'INVALID' })
    }

    const tokenAmount = ethers.BigNumber.from(creditTicket.height).sub(currentHeight)

    const provider = new ethers.providers.JsonRpcProvider(network.rpcUrls[0])

    const wallet = new ethers.Wallet(process.env.SYSTEM_WALLET_PRIVATE_KEY as string, provider)

    const filpass = FilPassFactory.connect(contracts[0].address, wallet)

    const transaction = await filpass.submitTicket(result.data)

    await prisma.submitTicketTransaction.create({
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

import { ATTOFIL, FIL, convert, getMasterWallet, getVerificationAmount, signMessage } from 'lib/filecoin'
import { getGasEstimation, getNonce, getWalletBalance, sendTransaction } from 'lib/filecoinApi'
import { logger } from 'lib/logger'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { DateTime } from 'luxon'
import { EMAIL_DOMAIN } from 'system.config'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { sendVerificationTransactionValidator } from './validation'
import { FilecoinApiResult } from 'domain/utils/sendFILWithMaster'

const ENABLE_BLOCKCHAIN_INTERACTION = process.env.ENABLE_BLOCKCHAIN_INTERACTION

interface SendVerificationTransactionParams {
  address: string
  userId: number
  blockchain: string
}

interface CheckVerificationParams {
  address: string
  userId: number
}

interface SendParams {
  message: any
  masterWallet: any
  masterWalletBalance: any
}

interface Message {
  To: string
  From: string
  Nonce: number
  Value: string
  GasLimit: number
  GasPremium: string
  GasFeeCap: string
  GasPrice: string
  Method: number
  Params: string
}

export async function sendVerificationTransaction(params: SendVerificationTransactionParams) {
  const { fields, errors } = await validate(sendVerificationTransactionValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { address, userId, blockchain } = fields
  const { error: dbValidationError, data: walletWithVerification } = await checkUserTransactions({ address, userId })
  if (dbValidationError) {
    logger.error('Error checking user transactions', dbValidationError)
    return {
      error: {
        status: 400,
        message: dbValidationError,
      },
    }
  }

  if (walletWithVerification) {
    return { data: walletWithVerification }
  }

  const userData = await prisma.user.findUnique({ where: { id: userId } })

  if (!userData) {
    logger.error('User not found', userId)
    return {
      error: {
        status: 400,
        message: errorsMessages.user_not_found.message,
      },
    }
  }

  const masterWallet = getMasterWallet()
  const { scale, value } = getVerificationAmount(userData.email.endsWith(EMAIL_DOMAIN))

  const { data: masterBalance, error: balanceError } = (await getWalletBalance(masterWallet.address)) as FilecoinApiResult

  if (balanceError) {
    logger.error('Error getting master wallet balance', balanceError)
    return {
      error: {
        status: balanceError.status,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  const masterWalletBalanceInFIL = convert(masterBalance.result, ATTOFIL, FIL).toString()
  if (+masterWalletBalanceInFIL < 0.5) {
    logger.warning('Master Wallet balance is lower than 0.5 FIL')
  }

  const message: Message = {
    To: address,
    From: masterWallet.address,
    Nonce: 0,
    Value: convert(String(value), scale, ATTOFIL).toString(),
    GasLimit: 0,
    GasPremium: '0',
    GasFeeCap: '0',
    GasPrice: '0',
    Method: 0,
    Params: '',
  }

  const { data, error } = await send({ message, masterWallet, masterWalletBalance: masterBalance.result })

  if (error || !data) {
    return { error }
  }

  const { signedTransaction, transactionId } = data

  const verification = await prisma.walletVerification.create({
    data: {
      address,
      blockchainId: 1, // TODO OPEN-SOURCE: should the id of the blockchain table
      transactionId: transactionId as string,
      transactionAmount: value,
      transactionContent: signedTransaction,
      transactionCurrencyUnit: {
        connect: {
          name: scale,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
    },
    select: {
      id: true,
      address: true,
      isVerified: true,
      transactionAmount: true,
    },
  })

  return {
    data: verification,
  }
}

export async function checkUserTransactions({ address, userId }: CheckVerificationParams) {
  const verifications = await prisma.walletVerification.findMany({
    where: {
      userId,
      createdAt: { gte: DateTime.now().minus({ hours: 24 }).toISO() as string },
    },
  })

  const foundVerification = verifications.find(w => w.address === address)
  if (foundVerification) {
    return { data: foundVerification }
  }

  if (verifications.length > 2) {
    return { error: errorsMessages.daily_verification_limit.message }
  }

  return {}
}

export async function send({ message, masterWallet, masterWalletBalance }: SendParams) {
  if (ENABLE_BLOCKCHAIN_INTERACTION == '0') {
    return {
      data: {
        transactionId: 'TEST_TRANSACTION_ID',
        signedTransaction: message,
      },
    }
  }

  const { data: gas, error: gasError } = (await getGasEstimation(message)) as FilecoinApiResult
  if (gasError) {
    logger.error('Error getting gas estimation', gasError)
    return {
      error: {
        status: gasError.status,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  const { data: nonce, error: nonceError } = (await getNonce(masterWallet.address)) as FilecoinApiResult
  if (nonceError) {
    logger.error('Error getting nonce', nonceError)
    return {
      error: {
        status: nonceError.status,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  const { GasLimit, GasFeeCap, GasPremium } = gas.result

  const estimatedMessage = {
    ...message,
    Nonce: nonce.result,
    GasLimit: GasLimit,
    GasFeeCap: GasFeeCap,
    GasPremium: GasPremium,
  }

  // TODO: investigate value case should be Value
  if (+masterWalletBalance < +message.value + +GasFeeCap) {
    logger.error('Insufficient funds on the Master Wallet, cant validate wallet.')
    return {
      error: {
        status: 400,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  // TODO: investigate signMessage receiving only one parameter
  const signature = await signMessage(estimatedMessage)
  const transaction = { Message: estimatedMessage, Signature: signature }

  const { data: pushResponse, error: pushError } = (await sendTransaction(transaction)) as FilecoinApiResult
  if (pushError) {
    logger.error('Error pushing transaction', pushError)
    return {
      error: {
        status: pushError.status,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  return {
    data: {
      transactionId: Object.values(pushResponse.result)[0],
      signedTransaction: transaction,
    },
  }
}

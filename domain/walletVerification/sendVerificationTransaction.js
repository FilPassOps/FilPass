import { captureException, captureMessage } from '@sentry/nextjs'
import { ATTOFIL, FIL, convert, getMasterWallet, getVerificationAmount, signMessage } from 'lib/filecoin'
import { getGasEstimation, getNonce, getWalletBalance, sendTransaction } from 'lib/filecoinApi'
import prisma from 'lib/prisma'
import { validate } from 'lib/yup'
import { DateTime } from 'luxon'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { sendVerificationTransactionValidator } from './validation'
import { EMAIL_DOMAIN } from 'system.config'

const ENABLE_BLOCKCHAIN_INTERACTION = process.env.ENABLE_BLOCKCHAIN_INTERACTION

export async function sendVerificationTransaction(params) {
  const { fields, errors } = await validate(sendVerificationTransactionValidator, params)
  if (errors) {
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
    return {
      error: {
        status: 400,
        message: errorsMessages.user_not_found.message,
      },
    }
  }

  const masterWallet = getMasterWallet()
  const { scale, value } = getVerificationAmount(userData.email.endsWith(EMAIL_DOMAIN))

  const { data: masterBalance, error: balanceError } = await getWalletBalance(masterWallet.address)

  if (balanceError) {
    captureException(balanceError)
    return {
      error: {
        status: balanceError.status,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  const masterWalletBalanceInFIL = convert(masterBalance.result, ATTOFIL, FIL).toString()
  if (+masterWalletBalanceInFIL < 0.5) {
    captureMessage('Master Wallet balance is lower than 0.5 FIL')
  }

  const message = {
    To: address,
    From: masterWallet.address,
    Nonce: 0,
    Value: convert(value, scale, ATTOFIL).toString(),
    GasLimit: 0,
    GasPremium: '0',
    GasFeeCap: '0',
    GasPrice: '0',
    Method: 0,
    Params: '',
  }

  const { data, error } = await send(message, masterWallet, masterBalance.result)

  if (error) {
    return { error }
  }

  const { signedTransaction, transactionId } = data

  const verification = await prisma.walletVerification.create({
    data: {
      address,
      blockchain,
      transactionId,
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

export async function checkUserTransactions({ address, userId }) {
  const verifications = await prisma.walletVerification.findMany({
    where: {
      userId,
      createdAt: { gte: DateTime.now().minus({ hours: 24 }).toISO() },
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

export async function send(message, masterWallet, masterWalletBalance) {
  if (ENABLE_BLOCKCHAIN_INTERACTION == 0) {
    return {
      data: {
        transactionId: 'TEST_TRANSACTION_ID',
        signedTransaction: message,
      },
    }
  }

  const { data: gas, error: gasError } = await getGasEstimation(message)
  if (gasError) {
    captureException(gasError)
    return {
      error: {
        status: gasError.status,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  const { data: nonce, error: nonceError } = await getNonce(masterWallet.address)
  if (nonceError) {
    captureException(nonceError)
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

  if (+masterWalletBalance < +message.value + +GasFeeCap) {
    captureMessage('Insufficient funds on the Master Wallet, cant validate wallet.')
    return {
      error: {
        status: 400,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  const signature = await signMessage(estimatedMessage, masterWallet)
  const transaction = { Message: estimatedMessage, Signature: signature }

  const { data: pushResponse, error: pushError } = await sendTransaction(transaction)
  if (pushError) {
    captureException(pushError)
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

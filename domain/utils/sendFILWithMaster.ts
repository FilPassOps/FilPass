import { getGasEstimation, getNonce, sendTransaction, getWalletBalance } from 'lib/filecoinApi'
import { ATTOFIL, FIL, convert, getMasterWallet, signMessage } from 'lib/filecoin'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { logger } from 'lib/logger'

interface SendFILWithMasterRequestParams {
  filAmount: string
  address: string
}

interface FilecoinApiResult {
  data?: any
  error?: {
    message?: string
    status?: number
    errors?: any
  }
}

export async function sendFILWithMaster({ filAmount, address }: SendFILWithMasterRequestParams) {
  const masterWallet = getMasterWallet()

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
    logger.warning('Master Wallet balance is lower than 0.5 FIL', masterWalletBalanceInFIL)
  }

  const message = {
    To: address,
    From: masterWallet.address,
    Nonce: 0,
    Value: convert(filAmount, FIL, ATTOFIL).toString(),
    GasLimit: 0,
    GasPremium: '0',
    GasFeeCap: '0',
    GasPrice: '0',
    Method: 0,
    Params: '',
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

  if (+masterBalance.result < +message.Value + +GasFeeCap) {
    logger.error('Insufficient funds on the Master Wallet, cant validate wallet.')
    return {
      error: {
        status: 400,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }

  const signature = await signMessage(estimatedMessage)
  const transaction = { Message: estimatedMessage, Signature: signature }

  const { data: pushResponse, error: pushError } = (await sendTransaction(transaction)) as FilecoinApiResult
  if (pushError) {
    logger.error('Error sending transaction', pushError)
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

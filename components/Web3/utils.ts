import errorsMessages from 'wordings-and-errors/errors-messages'
import { FilecoinDepositWithdrawRefund__factory as FilecoinDepositWithdrawRefundFactory } from 'typechain-types'

export const filpassInterface = FilecoinDepositWithdrawRefundFactory.createInterface()

export const getPaymentErrorMessage = (error: any) => {
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    let revertReasonHex: string | undefined

    // Check contract custom errors
    const message = error?.error?.data?.message || (error?.error?.reason as string)

    // // Use a regular expression to extract the revert reason hex code
    const match = message.match(/revert reason: (0x[0-9a-fA-F]+)/)
    if (match && match[1]) {
      revertReasonHex = match[1]
    }
    if (revertReasonHex) {
      try {
        const decodedError = filpassInterface.parseError(revertReasonHex)

        return decodedError.name
      } catch (decodeError) {
        return errorsMessages.error_during_payment.message
      }
    }
  } else if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
    return errorsMessages.user_rejected_payment.message
  } else if (error.code === -32603) {
    if (error?.data?.message?.includes('failed to estimate gas')) {
      if (error.data.message.includes('insufficient funds')) {
        return errorsMessages.not_enough_funds.message
      } else {
        return errorsMessages.check_account_balance.message
      }
    }
  } else {
    return errorsMessages.error_during_payment.message
  }
}

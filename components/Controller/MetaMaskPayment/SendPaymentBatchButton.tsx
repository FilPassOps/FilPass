import { api } from 'lib/api'
import { ContractTransaction } from 'ethers'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { TransferRequest } from './PaymentBatch'
import { Forward } from 'hooks/useContract'
import { ErrorAlert, SuccessAlert } from './Alerts'
import { AppConfig, Chain, ChainIds, ChainNames, ERC20Token, NativeToken } from 'config/index'
import { USD } from 'domain/currency/constants'
import Big from 'big.js'
import { WithMetaMaskButton } from 'components/Web3/MetaMaskProvider'
import { getBalance } from 'lib/blockchain-utils'
import { useAlertDispatcher } from 'components/Layout/Alerts'

interface SendPaymentProps {
  transferRequests: TransferRequest[]
  forward: Forward
  chain: Chain
  setIsBatchSent: (isBatchSent: boolean) => void
  wallet?: string
  token?: ERC20Token | NativeToken
  totalTokenAmount?: number | Big
  currency?: number
}

export const SendPayment = ({
  transferRequests,
  forward,
  chain,
  setIsBatchSent,
  wallet,
  token,
  totalTokenAmount,
  currency,
}: SendPaymentProps) => {
  const { dispatch, close } = useAlertDispatcher()

  const doForward = async () => {
    if (!wallet) {
      dispatch({
        type: 'warning',
        title: 'It seems you are not connected to a wallet',
        config: {
          closeable: true,
        },
      })
    }

    const addresses = []
    const amounts = []
    const requestsData = {} as any

    let preparedTransferRequests

    try {
      for (const { amount, wallet, program, id } of transferRequests) {
        addresses.push(wallet.address)

        const programCurrency = program.programCurrency.find(({ type }) => type === 'REQUEST')

        if (!currency) {
          throw new Error('Currency not found')
        }

        const transferAmount = programCurrency?.currency.name === USD ? new Big(Number(amount) / currency).toFixed(2) : amount

        if (!transferAmount) {
          throw new Error('Invalid amount')
        }

        amounts.push(transferAmount.toString())
        requestsData[id] = { id: id, amount: transferAmount.toString() }
      }

      const { data, error } = await api.post('/transfers/prepare', {
        requests: requestsData,
        from: wallet,
        to: chain.contractAddress,
      })

      if (error) {
        throw error
      }

      preparedTransferRequests = data
    } catch (error: any) {
      dispatch({
        type: 'error',
        title: 'Payment failed',
        config: {
          closeable: true,
        },
        body: () => <ErrorAlert handleClose={() => close()} message={error.message || errorsMessages.something_went_wrong.message} />,
      })
      return false
    }

    const requestIds = transferRequests.map(({ id }) => id)

    const { uuid, pendingTransferRequests } = preparedTransferRequests

    if (pendingTransferRequests.length > 0) {
      const isContinue = confirm(`It seems that some requests were already paid. Would you like to continue?`)
      if (!isContinue) {
        return false
      }
    }

    try {
      const { hash, from, to } = (await forward(chain.name, uuid, addresses, amounts)) as ContractTransaction

      await api.post('/transfers/payment-sent', {
        requests: requestIds,
        hash,
        from,
        to,
      })

      dispatch({
        type: 'success',
        title: 'Payment sent',
        config: {
          closeable: true,
        },
        body: () => (
          <SuccessAlert
            hash={hash}
            blockExplorerUrl={AppConfig.network.getChainByName(chain.name as ChainNames).blockExplorer.url}
            handleClose={() => close()}
          />
        ),
      })
      return true
    } catch (error: any) {
      const reason = error?.code === 'ACTION_REJECTED' ? undefined : error?.data?.message ?? error?.reason //only save reason if it's not user rejected
      api.post('/transfers/cancel', { requests: requestIds, reason })
      dispatch({
        type: 'error',
        title: 'Payment failed',
        config: {
          closeable: true,
        },
        body: () => (
          <ErrorAlert handleClose={() => close()}>
            <span className="text-sm text-gray-600 text-center first-letter:uppercase pt-2">{getPaymentErrorMessage(error)}</span>
          </ErrorAlert>
        ),
      })
      return false
    }
  }

  const getPaymentErrorMessage = (error: any) => {
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      return <p>{`${errorsMessages.user_rejected_payment.message}`}</p>
    } else if (error.code === -32603 && error?.data?.message.includes('failed to estimate gas')) {
      if (error.data.message.includes('insufficient funds')) {
        return <p>{`${errorsMessages.not_enough_funds.message}`}</p>
      } else {
        return <p>{`${errorsMessages.check_account_balance.message}`}</p>
      }
    } else {
      return <p>{`${errorsMessages.error_during_payment.message}`}</p>
    }
  }

  async function checkBalance() {
    try {
      if (!wallet || !token) {
        throw new Error('Wallet or token not found')
      }

      if (!totalTokenAmount) {
        throw new Error('Total token amount not found')
      }

      const balance = await getBalance(wallet, token)

      const hasBalance = new Big(balance).gte(totalTokenAmount)

      if (!hasBalance) {
        throw new Error(errorsMessages.check_account_balance.message)
      }
    } catch {
      dispatch({
        type: 'error',
        title: 'Payment failed',
        config: {
          closeable: true,
        },
        body: () => (
          <ErrorAlert handleClose={() => close()}>
            <span className="text-sm text-gray-600 text-center first-letter:uppercase pt-2">
              {errorsMessages.check_account_balance.message}
            </span>
          </ErrorAlert>
        ),
      })
      throw new Error(errorsMessages.check_account_balance.message)
    }
  }

  return (
    <WithMetaMaskButton
      className="w-full md:w-auto"
      targetChainId={chain.chainId as ChainIds}
      onBeforeClick={() => checkBalance()}
      onClick={async () => {
        const sent = await doForward()
        setIsBatchSent(sent)
      }}
    >
      Send payment
    </WithMetaMaskButton>
  )
}

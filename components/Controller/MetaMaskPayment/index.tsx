import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Blockchain, TransferStatus } from '@prisma/client'
import Big from 'big.js'
import { useAlertDispatcher } from 'components/Layout/Alerts'
import { Button } from 'components/Shared/Button'
import { useMetaMask } from 'components/Web3/MetaMaskProvider'
import { AppConfig, ChainNames, TokenOptions, isERC20Token } from 'config'
import { USD } from 'domain/currency/constants'
import { Forward } from 'hooks/useContract'
import useCurrency from 'hooks/useCurrency'
import { api } from 'lib/api'
import { formatCrypto, formatCurrency } from 'lib/currency'
import _ from 'lodash'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { ErrorAlert, SuccessAlert } from './Alerts'
import PaymentBatch from './PaymentBatch'
import { PaymentBatchStep } from './PaymentBatchStep'
import { ContractTransaction } from 'ethers'

interface ProgramCurrency {
  currency: {
    name: string
  }
  type: string
}

interface TransferRequest {
  id: number
  publicId: string
  amount: string
  wallet: { address: string; blockchain: Blockchain }
  program: {
    programCurrency: ProgramCurrency[]
    currency: {
      name: string
      blockchain: Blockchain
    }
  }
  transfers: { txHash: string; status: TransferStatus; amount: string; isActive: boolean; amountCurrencyUnit: { name: string } }[]
  isHexMatch?: boolean
}

interface MetamaskPaymentModalProps {
  data: TransferRequest[]
}

interface PaymentBatchData {
  blockchainName: string
  tokenSymbol: string
  isPaymentSent: boolean
  isHexMatch?: boolean
  data: TransferRequest[]
}

const PAYMENT_BATCH_SIZE = 100

const MetamaskPayment = ({ data = [] }: MetamaskPaymentModalProps) => {
  const router = useRouter()
  const { dispatch, close } = useAlertDispatcher()
  const { wallet } = useMetaMask()

  const [totalDollarAmount, setTotalDollarAmount] = useState(0)
  const [paymentBatchList, setPaymentBatchList] = useState<PaymentBatchData[]>([])
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)

  const paymentCurrency = data[0].program.programCurrency.find(({ type }) => type === 'PAYMENT')

  const currentBatch = paymentBatchList[currentBatchIndex]
  const chain = AppConfig.network.getChainByName(data[0].program.currency.blockchain.name as ChainNames)
  const token = AppConfig.network.getTokenBySymbolAndBlockchainName(paymentCurrency?.currency.name as TokenOptions, chain.name)

  const tokenIdentifier = isERC20Token(token) ? token.erc20TokenAddress : chain.chainId

  const { currency } = useCurrency(tokenIdentifier)

  useEffect(() => {
    let totalDollarAmount = 0

    for (const item of data) {
      const programCurrency = item.program.programCurrency.find(({ type }) => type === 'REQUEST')

      if (programCurrency?.currency.name === USD) {
        totalDollarAmount += Number(item.amount)
      } else {
        totalDollarAmount += Number(item.amount) * Number(currency)
      }
    }

    setTotalDollarAmount(totalDollarAmount)

    const finalList = _.chunk(data, PAYMENT_BATCH_SIZE).map(chunk => ({
      blockchainName: chunk[0].program.currency.blockchain.name,
      tokenSymbol: chunk[0].program.currency.name,
      isPaymentSent: false,
      data: chunk,
    }))

    setPaymentBatchList(finalList)
  }, [currency, data])

  useEffect(() => {
    document.getElementById('main')?.classList.add('md:bg-gray-100')

    return () => {
      document.getElementById('main')?.classList.remove('md:bg-gray-100')
    }
  }, [])

  const doForward = async (batch: TransferRequest[], forwardFunction: Forward, blockchainName: string) => {
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
      for (const { amount, wallet, program, id } of batch) {
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

    const requestIds = batch.map(({ id }) => id)

    const { uuid, pendingTransferRequests } = preparedTransferRequests

    if (pendingTransferRequests.length > 0) {
      const isContinue = confirm(`It seems that some requests were already paid. Would you like to continue?`)
      if (!isContinue) {
        return false
      }
    }

    try {
      const { hash, from, to } = (await forwardFunction(blockchainName, uuid, addresses, amounts)) as ContractTransaction

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
            blockExplorerUrl={AppConfig.network.getChainByName(blockchainName as ChainNames).blockExplorer.url}
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
            <span className="text-sm text-gray-600 text-center first-letter:uppercase pt-2">{handlePaymentErrors(error)}</span>
          </ErrorAlert>
        ),
      })
      return false
    }
  }

  const setIsBatchSent = (isPaymentSent: boolean) => {
    const newPaymentBatchList = [...paymentBatchList]
    newPaymentBatchList[currentBatchIndex].isPaymentSent = isPaymentSent
    setPaymentBatchList(newPaymentBatchList)
  }

  const setIsChunkHextMatch = (isChunkHexMatch: boolean) => {
    const newPaymentBatchList = [...paymentBatchList]
    newPaymentBatchList[currentBatchIndex].isHexMatch = isChunkHexMatch
    setPaymentBatchList(newPaymentBatchList)
  }

  const setHextMatch = (transferRequest: TransferRequest[]) => {
    const newPaymentBatchList = [...paymentBatchList]
    newPaymentBatchList[currentBatchIndex].data = transferRequest
    setPaymentBatchList(newPaymentBatchList)
  }

  const handlePaymentErrors = (error: any) => {
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

  return (
    <>
      <Button
        variant="primary-lighter"
        onClick={() => {
          if (paymentBatchList.find(paymentBatch => paymentBatch.isPaymentSent)) {
            router.reload()
          } else {
            router.back()
          }
        }}
        className="w-40 mb-4"
      >
        <div className="flex items-center gap-2">
          <ArrowLeftIcon className="w-4" /> Back
        </div>
      </Button>
      <div className="bg-white">
        {paymentBatchList.length > 1 && (
          <div className="flex gap-3 pb-5 md:p-6 max-w-full overflow-y-auto">
            {paymentBatchList.map((_, index) => (
              <PaymentBatchStep
                key={index}
                index={index + 1}
                status={paymentBatchList[index].isPaymentSent ? 'Sent' : index === currentBatchIndex ? 'Reviewing' : 'Pending'}
                handleOnClick={index => setCurrentBatchIndex(index)}
              />
            ))}
          </div>
        )}
        <div className="py-6 md:p-6 border-b border-gray-200">
          <h1 className="text-base md:text-lg text-gray-900 font-medium mb-2">
            Total payout amount:{' '}
            {totalDollarAmount && currency ? formatCrypto(new Big(totalDollarAmount).div(Number(currency)).toFixed(2)) : '-'} {token.symbol}
            <span className="text-sm text-gray-500"> ≈{formatCurrency(totalDollarAmount)}</span>
          </h1>
        </div>
        {currentBatch && (
          <PaymentBatch
            index={currentBatchIndex}
            batchData={currentBatch}
            forwardHandler={doForward}
            setIsBatchSent={setIsBatchSent}
            setHextMatch={setHextMatch}
            setIsChunkHextMatch={setIsChunkHextMatch}
          />
        )}
      </div>
    </>
  )
}

export default MetamaskPayment

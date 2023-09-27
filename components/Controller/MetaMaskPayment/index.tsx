import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Blockchain, TransferStatus } from '@prisma/client'
import Big from 'big.js'
import { useAlertDispatcher } from 'components/Layout/Alerts'
import { Button } from 'components/shared/Button'
import { useMetaMask } from 'components/web3/MetaMaskProvider'
import { ForwardNonBLS } from 'components/web3/useContract'
import { USD } from 'domain/currency/constants'
import { api } from 'lib/api'
import { formatCrypto, formatCurrency } from 'lib/currency'
import _ from 'lodash'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { getChainByName } from 'system.config'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { ErrorAlert, SuccessAlert } from './Alerts'
import PaymentBatch from './PaymentBatch'
import { PaymentBatchStep } from './PaymentBatchStep'
import useCurrency from 'components/web3/useCurrency'

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
  program: { programCurrency: ProgramCurrency[]; blockchain: Blockchain }
  transfers: { txHash: string; status: TransferStatus; amount: string; isActive: boolean; amountCurrencyUnit: { name: string } }[]
  isHexMatch?: boolean
}

interface MetamaskPaymentModalProps {
  data: TransferRequest[]
}

interface PaymentBatchData {
  blockchainName: string
  isPaymentSent: boolean
  isHexMatch?: boolean
  data: TransferRequest[]
}

const MetamaskPayment = ({ data = [] }: MetamaskPaymentModalProps) => {
  const router = useRouter()
  const { dispatch, close } = useAlertDispatcher()
  const { wallet } = useMetaMask()

  const [totalDollarAmount, setTotalDollarAmount] = useState(0)
  const [paymentBatchList, setPaymentBatchList] = useState<PaymentBatchData[]>([])
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)

  const currentBatch = paymentBatchList[currentBatchIndex]
  const chain = getChainByName(data[0].program.blockchain.name)
  const {currency} = useCurrency(chain.chainId)

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

    const finalList = _.chunk(data, 10).map(chunk => ({
      blockchainName: chunk[0].program.blockchain.name,
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

  const doForward = async (batch: TransferRequest[], forwardFunction: ForwardNonBLS, blockchainName: string) => {
    if (!wallet) {
      dispatch({
        type: 'warning',
        title: 'It seems you are not connected to a wallet',
        config: {
          closeable: true,
        },
      })
    }

    const requestIds = batch.map(({ id }) => id)

    const { data, error } = await api.post('/transfers/prepare', {
      requests: requestIds,
      from: wallet,
      to: chain.contractAddress,
    })

    if (error) {
      dispatch({
        type: 'error',
        title: 'Payment failed',
        config: {
          closeable: true,
        },
        body: () => <ErrorAlert handleClose={() => close()} message={error.message} />,
      })
      return false
    }

    const { uuid, pendingTransferRequests } = data

    if (pendingTransferRequests.length > 0) {
      const isContinue = confirm(`It seems that some requests were already paid. Would you like to continue?`)
      if (!isContinue) {
        return false
      }
    }

    try {
      const addresses = []
      const amounts = []

      for (const { amount, wallet } of batch) {
        addresses.push(wallet.address)
        amounts.push(amount.toString())
      }

      const { hash, from, to } = await forwardFunction(blockchainName, uuid, addresses, amounts)

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
          <SuccessAlert hash={hash} blockExplorerUrl={getChainByName(blockchainName).blockExplorer.url} handleClose={() => close()} />
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
            Total payout amount: {formatCrypto(new Big(totalDollarAmount).div(Number(currency)).toFixed(2))} {chain.symbol}
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

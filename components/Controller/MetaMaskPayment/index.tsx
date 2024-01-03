import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Blockchain, TransferStatus } from '@prisma/client'
import { Button } from 'components/Shared/Button'
import { AppConfig, ChainNames, TokenOptions } from 'config'
import { formatCurrency } from 'lib/currency'
import _ from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import PaymentBatch, { PaymentBatchData } from './PaymentBatch'
import { PaymentBatchStep } from './PaymentBatchStep'

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

interface TotalAmount {
  [key: string]: {
    dollar: number
    token: Big
  }
}

const PAYMENT_BATCH_SIZE = 100

const MetamaskPayment = ({ data = [] }: MetamaskPaymentModalProps) => {
  const router = useRouter()

  const [totalDollarAmount, setTotalDollarAmount] = useState<TotalAmount>({})
  const [paymentBatchList, setPaymentBatchList] = useState<PaymentBatchData[]>([])
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)

  console.log('Total amount', totalDollarAmount)

  const currentBatch = paymentBatchList[currentBatchIndex]

  const handleTotalAmountChange = useCallback((tokenAmount: Big, dollarAmount: number, tokenSymbol: string) => {
    setTotalDollarAmount(prevAmount => {
      if (!prevAmount[tokenSymbol]) {
        return {
          ...prevAmount,
          [tokenSymbol]: { dollar: dollarAmount, token: tokenAmount },
        }
      }

      return {
        ...prevAmount,
        [tokenSymbol]: { dollar: prevAmount[tokenSymbol].dollar + dollarAmount, token: prevAmount[tokenSymbol].token.add(tokenAmount) },
      }
    })
  }, [])

  useEffect(() => {
    const groupedData = _.groupBy(data, item => item.program.currency.name)

    const finalList = _.flatMap(groupedData, group => {
      return _.chunk(group, PAYMENT_BATCH_SIZE).map(chunk => ({
        blockchain: AppConfig.network.getChainByName(chunk[0].program.currency.blockchain.name as ChainNames),
        token: AppConfig.network.getTokenBySymbolAndBlockchainName(
          chunk[0].program.currency.name as TokenOptions,
          chunk[0].program.currency.blockchain.name as ChainNames,
        ),
        isPaymentSent: false,
        data: chunk,
      }))
    })

    setPaymentBatchList(finalList)
  }, [data])

  useEffect(() => {
    document.getElementById('main')?.classList.add('md:bg-gray-100')

    return () => {
      document.getElementById('main')?.classList.remove('md:bg-gray-100')
    }
  }, [])

  const setIsBatchSent = (isPaymentSent: boolean) => {
    const newPaymentBatchList = [...paymentBatchList]
    newPaymentBatchList[currentBatchIndex].isPaymentSent = isPaymentSent
    setPaymentBatchList(newPaymentBatchList)
  }

  const setIsChunkHexMatch = (isChunkHexMatch: boolean) => {
    const newPaymentBatchList = [...paymentBatchList]
    newPaymentBatchList[currentBatchIndex].isHexMatch = isChunkHexMatch
    setPaymentBatchList(newPaymentBatchList)
  }

  const setHexMatch = (transferRequest: TransferRequest[]) => {
    const newPaymentBatchList = [...paymentBatchList]
    newPaymentBatchList[currentBatchIndex].data = transferRequest
    setPaymentBatchList(newPaymentBatchList)
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
            {/* {totalDollarAmount && currency ? formatCrypto(new Big(totalDollarAmount).div(Number(currency)).toFixed(2)) : '-'} {token.symbol} */}
            <span className="text-sm text-gray-500"> ≈{formatCurrency(totalDollarAmount)}</span>
          </h1>
        </div>
        {currentBatch && (
          <PaymentBatch
            index={currentBatchIndex}
            batchData={currentBatch}
            setIsBatchSent={setIsBatchSent}
            setHexMatch={setHexMatch}
            setIsChunkHexMatch={setIsChunkHexMatch}
            setBatchTotalDollarAmount={handleTotalAmountChange}
          />
        )}
        {paymentBatchList.map((paymentBatch, index) => {

          return (
            <PaymentBatch
              key={index}
              index={index}
              batchData={paymentBatch}
              setIsBatchSent={setIsBatchSent}
              setHexMatch={setHexMatch}
              setIsChunkHexMatch={setIsChunkHexMatch}
              setBatchTotalDollarAmount={handleTotalAmountChange}
            />
          )
        }
        )}
      </div>
    </>
  )
}

export default MetamaskPayment

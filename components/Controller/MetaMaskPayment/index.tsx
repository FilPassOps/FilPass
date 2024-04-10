import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Blockchain, TransferStatus } from '@prisma/client'
import { Button } from 'components/Shared/Button'
import { AppConfig, ChainNames, TokenOptions } from 'config'
import _ from 'lodash'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
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

const PAYMENT_BATCH_SIZE = 100

const MetamaskPayment = ({ data = [] }: MetamaskPaymentModalProps) => {
  const router = useRouter()

  const [paymentBatchList, setPaymentBatchList] = useState<PaymentBatchData[]>([])
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)

  const currentBatch = paymentBatchList[currentBatchIndex]

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
        variant="outline"
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

        {currentBatch && (
          <PaymentBatch
            index={currentBatchIndex}
            batchData={currentBatch}
            setIsBatchSent={setIsBatchSent}
            setHexMatch={setHexMatch}
            setIsChunkHexMatch={setIsChunkHexMatch}
          />
        )}
      </div>
    </>
  )
}

export default MetamaskPayment

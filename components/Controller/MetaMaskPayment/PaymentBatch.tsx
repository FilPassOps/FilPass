import { Bars4Icon } from '@heroicons/react/24/outline'
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, CurrencyDollarIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { Blockchain, TransferStatus } from '@prisma/client'
import Big from 'big.js'
import { useAlertDispatcher } from 'components/Layout/Alerts'
import { Button } from 'components/Shared/Button'
import Currency, { CryptoAmount } from 'components/Shared/Table/Currency'
import { WalletAddress } from 'components/Shared/WalletAddress'
import { WithMetaMaskButton, useMetaMask } from 'components/Web3/MetaMaskProvider'
import { AppConfig, ChainNames, TokenOptions, isERC20Token } from 'config'
import { USD } from 'domain/currency/constants'
import { Forward, contractInterface, useContract } from 'hooks/useContract'
import useCurrency from 'hooks/useCurrency'
import { getBalance } from 'lib/blockchain-utils'
import { formatCrypto, formatCurrency } from 'lib/currency'
import { useState } from 'react'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { ErrorAlert } from './Alerts'
import { Table, TableDiv, TableHeader } from './Table'
import { TransactionParser } from './TransactionParser'

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
  wallet: { address: string; blockchain: Blockchain; verificationId?: string }
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

interface PaymentBatchData {
  blockchainName: string
  tokenSymbol: string
  isPaymentSent: boolean
  isHexMatch?: boolean
  data: TransferRequest[]
}

interface ParsedData {
  functionName: string
  id: string
  addresses: string[]
  amount: string[]
}

interface BatchProps {
  index: number
  batchData: PaymentBatchData
  forwardHandler: (batch: TransferRequest[], forwardFunction: Forward, blockchainName: string) => Promise<boolean>
  setIsBatchSent: (isBatchSent: boolean) => void
  setIsChunkHextMatch: (isChunkHextMatch: boolean) => void
  setHextMatch: (transferRequests: TransferRequest[]) => void
}

const PaymentBatch = ({ index, batchData, forwardHandler, setIsBatchSent, setIsChunkHextMatch, setHextMatch }: BatchProps) => {
  const { data, isPaymentSent, isHexMatch, blockchainName, tokenSymbol } = batchData
  const [isOpen, setIsOpen] = useState(false)
  const token = AppConfig.network.getTokenBySymbolAndBlockchainName(tokenSymbol as TokenOptions, blockchainName as ChainNames)
  const { wallet } = useMetaMask()
  const { forward } = useContract(token)
  const { chainId } = AppConfig.network.getChainByName(blockchainName as ChainNames)
  const { dispatch, close } = useAlertDispatcher()

  const tokenIdentifier = isERC20Token(token) ? token.erc20TokenAddress : chainId

  const { currency } = useCurrency(tokenIdentifier)

  let totalDollarAmount = 0

  for (const item of data) {
    const programCurrency = item.program.programCurrency.find(({ type }) => type === 'REQUEST')

    if (programCurrency?.currency.name === USD) {
      totalDollarAmount += Number(item.amount)
    } else {
      totalDollarAmount += Number(item.amount) * Number(currency)
    }
  }

  const totalTokenAmount = currency && totalDollarAmount && new Big(totalDollarAmount).div(currency)

  const validateParseData = (parsedData: ParsedData) => {
    const isValidFunctionCall = contractInterface.getFunction('forward').name

    const parsedDataArray = parsedData.addresses.reduce((acc, address, index) => {
      return [...acc, { address, amount: parsedData.amount[index] }]
    }, Array<{ address: string; amount: string }>())

    const newData = data.map(tranferRequest => {
      const address = tranferRequest.wallet.address.toLowerCase()

      const foundIndex = parsedDataArray.findIndex(item => {
        const trRequestUnit = tranferRequest.program.programCurrency.find(({ type }) => type === 'REQUEST') as ProgramCurrency

        if (!currency) {
          return
        }

        const trConvertedAmount =
          trRequestUnit.currency.name === USD ? new Big(Number(tranferRequest.amount) / currency).toFixed(2) : tranferRequest.amount

        return item.address.toLowerCase() === address && Number(item.amount) === Number(trConvertedAmount)
      })

      if (foundIndex !== -1 && isValidFunctionCall) {
        tranferRequest.isHexMatch = true
        parsedDataArray.splice(foundIndex, 1) //remove the matched item to avoid duplicate
      } else {
        tranferRequest.isHexMatch = false
      }

      return tranferRequest
    })

    setHextMatch(newData)

    if (parsedDataArray.length > 0) {
      return false
    }
    if (newData.some(item => item.isHexMatch === false)) {
      return false
    }
    return true
  }
  const handleParseData = async (parsedData: ParsedData) => {
    const isValid = validateParseData(parsedData)
    setIsChunkHextMatch(isValid)
  }

  async function hasSufficientBalance() {
    const balance = await getBalance(wallet ?? '', token)

    if (!totalTokenAmount) return false
    return new Big(balance).gte(totalTokenAmount)
  }

  async function checkBalance() {
    const hasBalance = await hasSufficientBalance()

    if (!hasBalance) {
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
      throw new Error('No balance')
    }
  }

  return (
    <div key={index} className="text-gray-900">
      <div className="md:p-6 flex flex-wrap items-center justify-between border-b border-gray-200 gap-4 py-5">
        <div>
          <h2 className="text-base md:text-xl text-gray-900 font-medium mb-2">{`Batch ${index + 1}`}</h2>
          <div className="flex items-center gap-2 md:gap-6 text-gray-500 text-xs md:text-base">
            <div className="flex items-center gap-2">
              <Bars4Icon className="w-6 text-gray-400" /> {data.length} Requests
            </div>
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-6 text-gray-400" />
              {totalTokenAmount ? formatCrypto(totalTokenAmount.toFixed(2)) : '-'} {data[0].program.currency.name}
              <span className="text-sm "> ≈{formatCurrency(totalDollarAmount)}</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4">
          {!isPaymentSent && (
            <WithMetaMaskButton
              className="w-full md:w-auto"
              targetChainId={AppConfig.network.getChainByName(blockchainName as ChainNames).chainId}
              onBeforeClick={checkBalance}
              onClick={async () => {
                const sent = await forwardHandler(data, forward, blockchainName)
                setIsBatchSent(sent)
              }}
            >
              Send payment
            </WithMetaMaskButton>
          )}
          {isPaymentSent && (
            <Button className="py-2" variant="primary-lighter" disabled>
              Payment Sent
            </Button>
          )}
          <button onClick={() => setIsOpen(state => !state)} className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            {isOpen ? (
              <ChevronUpIcon className="w-4 md:w-6" aria-label="Hide batch details" />
            ) : (
              <ChevronDownIcon className="w-4 md:w-6" aria-label="Show batch details" />
            )}
          </button>
        </div>
      </div>
      <div className={`${isOpen ? 'block' : 'hidden'} py-6 md:p-6`}>
        {isHexMatch !== undefined && <ParseResultMessage isSucess={isHexMatch} />}
        <TransactionParser onParseData={handleParseData} />
        <div className="overflow-x-scroll">
          <Table cols="grid-cols-5" className="bg-white">
            <TableHeader>No</TableHeader>
            <TableHeader>Destination</TableHeader>
            <TableHeader>Amount</TableHeader>
            <TableHeader>Token Amount</TableHeader>
            <TableHeader>Hex Match</TableHeader>
            {data.map(({ id, amount, wallet, program, publicId, transfers, isHexMatch }) => {
              const requestUnit = program.programCurrency.find(({ type }) => type === 'REQUEST') as ProgramCurrency
              const paymentUnit = program.programCurrency.find(({ type }) => type === 'PAYMENT') as ProgramCurrency
              return (
                <div key={id} className="contents">
                  <TableDiv>
                    <div className="flex items-center gap-1">
                      {`#${publicId}`}
                      {transfers.find(transfer => transfer.txHash) && (
                        <span title="Payment already sent">
                          <XCircleIcon className="w-5 h-5 text-red-700" />
                        </span>
                      )}
                    </div>
                  </TableDiv>
                  <TableDiv>
                    <WalletAddress
                      address={wallet.address}
                      blockchain={wallet.blockchain.name}
                      isVerified={!!wallet.verificationId}
                      shortenLength="very-short"
                    />
                  </TableDiv>
                  <TableDiv>
                    <Currency amount={amount} requestCurrency={requestUnit.currency.name} paymentUnit={paymentUnit.currency.name} />
                  </TableDiv>
                  <TableDiv>
                    <div className="w-40">
                      <CryptoAmount>
                        {requestUnit.currency.name === USD && currency
                          ? formatCrypto(new Big(Number(amount) / Number(currency)).toFixed(2))
                          : amount}{' '}
                        {paymentUnit.currency.name}
                      </CryptoAmount>
                    </div>
                  </TableDiv>
                  <TableDiv>{isHexMatch !== undefined && <HexMatchTag isMatch={isHexMatch} />}</TableDiv>
                </div>
              )
            })}
          </Table>
        </div>
      </div>
    </div>
  )
}

export default PaymentBatch

const ParseResultMessage = ({ isSucess }: { isSucess: boolean }) => {
  const Icon = isSucess ? CheckCircleIcon : XCircleIcon
  const message = isSucess
    ? 'All requests match.'
    : `There are unmatched requests. Since this a security concern, we recommend stopping and reach out to ${AppConfig.app.emailConfig.supportAddress}.`
  return (
    <div className={`w-full p-4 flex items-center gap-3 mb-5 ${isSucess ? 'bg-green-50' : 'bg-red-50'}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${isSucess ? 'text-green-400' : 'text-red-400'}`} />
      <p className={`text-sm ${isSucess ? 'text-green-800' : 'text-red-800'}`}>{message}</p>
    </div>
  )
}

const HexMatchTag = ({ isMatch }: { isMatch: boolean }) => {
  return (
    <p className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${isMatch ? 'text-green-800 bg-green-100' : 'text-red-700 bg-red-100'}`}>
      {isMatch ? 'Matched' : 'Unmatched'}
    </p>
  )
}

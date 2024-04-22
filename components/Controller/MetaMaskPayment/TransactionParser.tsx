import { useAlertDispatcher } from 'components/Layout/Alerts'
import { Button } from 'components/Shared/Button'
import { getInputClasses } from 'components/Shared/FormInput'
import { contractInterface } from 'hooks/useContract'
import { amountConverter } from 'lib/blockchain-utils'
import { useState } from 'react'
import Image from 'next/image'
import { ERC20Token, NativeToken } from 'config/chains'
import { ethers } from 'ethers'

interface ParsedData {
  functionName: string
  id: string
  addresses: string[]
  amount: string[]
}

interface TransactionParserProps {
  onParseData: (data: ParsedData) => void
  token: NativeToken | ERC20Token
}

export const TransactionParser = ({ onParseData, token }: TransactionParserProps) => {
  const [hexDataInput, setHexDataInput] = useState('')
  const [error, setError] = useState('')
  const { dispatch, close } = useAlertDispatcher()

  const showMetamaskHexData = () => {
    dispatch({
      title: 'How to get the hex data from Metamask',
      config: {
        closeable: true,
      },
      body: () => (
        <div className="pt-4">
          <p>To retrieve the hexadecimal (hex) data from MetaMask, follow these steps:</p>
          <ol className="list-decimal list-inside my-4">
            <li>
              Click on <strong>Send Payment</strong> button to open the MetaMask payment modal.
            </li>
            <li>
              Click on the <strong>HEX</strong> tab located above the payment amount.
            </li>
            <li>Scroll to the bottom of the page.</li>
            <li>
              Click the <strong>Copy raw transaction data</strong> button.
            </li>
          </ol>
          <Image alt="Hex data example on MetaMask" src="/examples/hex-payment.png" height={629} width={400} priority />
          <p className="my-4">
            Now you can use the copied hex data to verify the payment request on the <strong>Hex Data Parser</strong>.
          </p>
          <Button className="self-center" onClick={() => close()}>
            Close
          </Button>
        </div>
      ),
    })
  }

  const handleParse = (token: NativeToken | ERC20Token) => {
    try {
      const transactionDescription = contractInterface.parseTransaction({
        data: hexDataInput,
      })

      const functionName = transactionDescription.name
      const [id, addresses, amount] = transactionDescription.args

      onParseData({
        functionName,
        id,
        addresses: addresses,
        amount: amount.map((item: ethers.BigNumber) => amountConverter(item, token.decimals)),
      })
    } catch (error) {
      setError('Invalid hex data')
    }
  }

  return (
    <div>
      <label htmlFor="hex-data" className="block text-sm font-semibold text-gray-900 mb-2">
        Hex Data Parser
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          id="hex-data"
          name="hex-data"
          className={getInputClasses({ error: false, disabled: false })}
          onChange={e => {
            setHexDataInput(e.target.value)
            error && setError('')
          }}
          value={hexDataInput}
          placeholder="0x1cd5a66500000000000000000..."
        />
        <Button className="" onClick={() => handleParse(token)}>
          Parse
        </Button>
      </div>
      <p className="text-gray-500 text-sm font-normal mt-2 mb-6">
        As an additional security measure, we recommend verifying requests using the Hex Data Parser -{' '}
        <button className="underline text-teal-700 font-semibold" onClick={() => showMetamaskHexData()}>
          more info here
        </button>
        .
      </p>
      {error && <p className="text-red-500 text-sm my-2">{error}</p>}
    </div>
  )
}

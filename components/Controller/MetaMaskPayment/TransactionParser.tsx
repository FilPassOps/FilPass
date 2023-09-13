import { useAlertDispatcher } from 'components/Layout/Alerts'
import { Button } from 'components/shared/Button'
import { getInputClasses } from 'components/shared/FormInput'
import { contractInterface } from 'components/web3/useContract'
import { amountConverter, hexAddressDecoder } from 'lib/getDelegatedAddress'
import { useState } from 'react'

interface ParsedData {
  functionName: string
  id: string
  addresses: string[]
  amount: string[]
}

interface TransactionParserProps {
  onParseData: (data: ParsedData, blockchainName: string) => void
  blockchainName: string
}

export const TransactionParser = ({ onParseData, blockchainName }: TransactionParserProps) => {
  const [hexDataInput, setHexDataInput] = useState('')
  const [error, setError] = useState('')
  const { dispatch } = useAlertDispatcher()

  const showMetamaskHexData = () => {
    dispatch({
      title: 'How to get the hex data from Metamask',
      config: {
        closeable: true,
      },
      body: () => (
        <div>
          <video controls src="https://s3.us-east-2.amazonaws.com/coinemissary.com/metamask-hex-data.mp4" />
        </div>
      ),
    })
  }

  const handleParse = () => {
    try {
      const transactionDescription = contractInterface.parseTransaction({
        data: hexDataInput,
      })

      const functionName = transactionDescription.name
      const [id, addresses, amount] = transactionDescription.args

      onParseData(
        {
          functionName,
          id,
          addresses: addresses.map(hexAddressDecoder),
          amount: amount.map(amountConverter),
        },
        blockchainName,
      )
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
        <Button className="" onClick={handleParse}>
          Parse
        </Button>
      </div>
      <p className="text-gray-500 text-sm font-normal mt-2 mb-6">
        As an additional security measure, we recommend verifying requests using the Hex Data Parser -{' '}
        <button className="underline text-purple-500 font-semibold" onClick={() => showMetamaskHexData()}>
          more info here
        </button>
        .
      </p>
      {error && <p className="text-red-500 text-sm my-2">{error}</p>}
    </div>
  )
}

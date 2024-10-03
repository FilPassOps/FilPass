import { ClipboardIcon } from '@heroicons/react/24/outline'
import Big from 'big.js'
import { Button } from 'components/Shared/Button'
import { CreditToken } from 'pages/transfer-credits/[id]'
import { useState } from 'react'

interface TokenListProps {
  creditTokens: CreditToken[]
  maxHeight: string
  currentHeight: Big
}

export const TokenList = ({ creditTokens, maxHeight, currentHeight }: TokenListProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div>
      {creditTokens.length > 0 ? (
        <div className="space-y-4">
          {creditTokens.map((split, index) => (
            <div key={split.id} className="border-b pb-4 last:border-b-0">
              <h3 className="font-semibold text-deep-koamaru">Split Token {index + 1}</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <span className="col-span-2">
                  <TokenStatus token={split} currentHeight={currentHeight} />
                </span>
                <div>
                  <p className="text-gray-600 font-semibold">Height:</p>
                  <p className="text-deep-koamaru">
                    {split.height}/{maxHeight} Credits
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-semibold">Token:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-deep-koamaru">{`${split.token.slice(0, 6)}...${split.token.slice(-6)}`}</p>
                    <Button variant="none" className="p-0" onClick={() => copyToClipboard(split.token, `split-${index}`)}>
                      <ClipboardIcon className="h-4 w-4" />
                    </Button>
                    {copiedField === `split-${index}` && <span className="text-green-500 text-sm">Copied!</span>}
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-semibold">Lane:</p>
                  <p className="text-deep-koamaru">{split.lane}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No split tokens available.</p>
      )}
    </div>
  )
}

interface TokenStatusProps {
  token: CreditToken
  currentHeight: Big
}

export const TokenStatus = ({ token, currentHeight }: TokenStatusProps) => {
  if (!token.redeemable) {
    return <span className={`text-gray-500 bg-gray-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Redeemed</span>
  } else if (new Big(token.height).lt(currentHeight)) {
    return <span className={`text-red-500 bg-red-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Insufficient</span>
  } else {
    return <span className={`text-green-500 bg-green-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Redeemable</span>
  }
}

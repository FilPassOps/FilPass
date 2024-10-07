import { ClipboardIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { ProgramCurrency } from '@prisma/client'
import Big from 'big.js'
import { TableDiv, TableHeader, Table } from 'components/Controller/MetaMaskPayment/Table'
import { Button } from 'components/Shared/Button'
import { CreditToken } from 'pages/transfer-credits/[id]'
import { useState } from 'react'

interface TokenListProps {
  creditTokens: CreditToken[]
  maxHeight: string
  currentHeight: Big
  isOpen: boolean
}

export const TokenList = ({ creditTokens, maxHeight, currentHeight, isOpen }: TokenListProps) => {
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className={`${isOpen ? 'block' : 'hidden'} py-3 md:p-3`}>
      <div className="overflow-x-scroll">
        <Table cols="grid-cols-4" className="bg-white">
          <TableHeader>No</TableHeader>
          <TableHeader>Height</TableHeader>
          <TableHeader>Status</TableHeader>
          <TableHeader>Token</TableHeader>

          {creditTokens.map(tokenItem => {
            return (
              <div key={tokenItem.id} className="contents">
                <TableDiv>
                  <div className="flex items-center gap-1">{`#${tokenItem.id}`}</div>
                </TableDiv>
                <TableDiv>{tokenItem.height}</TableDiv>
                <TableDiv>
                  <TokenStatus token={tokenItem} currentHeight={currentHeight} />
                </TableDiv>
                <TableDiv>
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-deep-koamaru">{`${tokenItem.token.slice(0, 6)}...${tokenItem.token.slice(-6)}`}</p>
                    <Button variant="none" className="p-0" onClick={() => copyToClipboard(tokenItem.token, tokenItem.id.toString())}>
                      <ClipboardIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableDiv>
              </div>
            )
          })}
        </Table>
      </div>
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
  } else if (new Big(token.height).lte(currentHeight)) {
    return <span className={`text-red-500 bg-red-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Insufficient</span>
  } else {
    return <span className={`text-green-500 bg-green-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Redeemable</span>
  }
}

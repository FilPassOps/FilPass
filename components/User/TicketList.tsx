import { ClipboardIcon } from '@heroicons/react/24/outline'
import { Button } from 'components/Shared/Button'
import { Cell, Header, Table, TableBody, TableHead } from 'components/Shared/Table'
import { AppConfig } from 'config/system'
import { BigNumber, ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { CreditTicket } from 'pages/transfer-credits/[id]'

interface TicketListProps {
  creditTickets: CreditTicket[]
  currentHeight: BigNumber
  isOpen: boolean
}

export const TicketList = ({ creditTickets, currentHeight, isOpen }: TicketListProps) => {
  const fil = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className={`${isOpen ? 'block' : 'hidden'} py-3 md:p-3`}>
      <Table>
        <TableHead>
          <tr>
            <Header style={{ minWidth: 100, width: 100 }}>No</Header>
            <Header style={{ minWidth: 250 }}>Exchanged so far</Header>
            <Header style={{ minWidth: 250 }}>Current Amount</Header>
            <Header style={{ minWidth: 200 }}>Status</Header>
            <Header style={{ minWidth: 200 }}>JSON Token</Header>
          </tr>
        </TableHead>
        <TableBody>
          {creditTickets.map(ticketItem => {
            const ticketHeight = ethers.BigNumber.from(ticketItem.height)
            const heightDiff = ticketHeight.sub(currentHeight)
            const currentAmount = heightDiff.gt(0) ? heightDiff : ethers.BigNumber.from(0)
            const parsedTicketHeight = formatUnits(ticketHeight, fil.decimals)
            const parsedCurrentAmount = formatUnits(currentAmount, fil.decimals)
            return (
              <tr key={ticketItem.id}>
                <Cell>{`#${ticketItem.id}`}</Cell>
                <Cell>{parsedTicketHeight}</Cell>
                <Cell>{parsedCurrentAmount}</Cell>
                <Cell>
                  <TicketStatus ticketHeight={ticketHeight} redeemable={ticketItem.redeemable} currentHeight={currentHeight} />
                </Cell>
                <Cell>
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-deep-koamaru">{`${ticketItem.token.slice(0, 6)}...${ticketItem.token.slice(-6)}`}</p>
                    <Button variant="none" className="p-0" onClick={() => copyToClipboard(ticketItem.token)}>
                      <ClipboardIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </Cell>
              </tr>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

interface TicketStatusProps {
  redeemable: boolean
  ticketHeight: BigNumber
  currentHeight: BigNumber
}

export const TicketStatus = ({ redeemable, ticketHeight, currentHeight }: TicketStatusProps) => {
  if (!redeemable) {
    return <span className={`text-gray-500 bg-gray-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Redeemed</span>
  } else if (ticketHeight.lte(currentHeight)) {
    return <span className={`text-red-500 bg-red-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Insufficient</span>
  } else {
    return <span className={`text-green-500 bg-green-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Redeemable</span>
  }
}

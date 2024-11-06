import { ClipboardIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { CreditTicketStatus } from '@prisma/client'
import { Button } from 'components/Shared/Button'
import { Cell, Header, Table, TableBody, TableHead } from 'components/Shared/Table'
import { AppConfig } from 'config/system'
import { BigNumber, ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { CreditTicket } from 'pages/transfer-credits/[id]'

interface TicketListProps {
  creditTickets: CreditTicket[]
  expired: boolean
  currentHeight: BigNumber
  isOpen: boolean
}

export const TicketList = ({ creditTickets, currentHeight, isOpen, expired }: TicketListProps) => {
  const { token } = AppConfig.network.getFilecoin()

  const copyToClipboard = (text: string) => {
    if (!process.env.IS_DEV) {
      unsecuredCopyToClipboard(text)
    } else {
      navigator.clipboard.writeText(text)
    }

    function unsecuredCopyToClipboard(text: string) {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (err) {
        console.error('Unable to copy to clipboard', err)
      }
      document.body.removeChild(textArea)
    }
  }

  const downloadTickets = () => {
    try {
      const ticketsData = creditTickets.map(({ id, token, height, status }) => ({
        id,
        token,
        height,
        status,
      }))

      const blob = new Blob([JSON.stringify(ticketsData, null, 2)], {
        type: 'application/json;charset=utf-8',
      })

      const url = URL.createObjectURL(blob)

      try {
        const link = document.createElement('a')
        link.href = url
        link.download = `tickets-${new Date().toISOString().split('T')[0]}.json`
        link.click()
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download tickets:', error)
    }
  }

  return (
    <div className={`${isOpen ? 'block' : 'hidden'} py-3 md:p-3 overflow-x-auto`}>
      <div className="flex justify-end mb-4">
        <Button variant="secondary" onClick={downloadTickets} className="flex items-center gap-2">
          <ArrowDownTrayIcon className="h-4 w-4" />
          <p>Download Tickets</p>
        </Button>
      </div>
      <Table style={{ display: 'table' }}>
        <TableHead>
          <tr>
            <Header style={{ width: '10%' }}>No</Header>
            <Header style={{ width: '25%' }}>Exchanged so far</Header>
            <Header style={{ width: '25%' }}>Current Amount</Header>
            <Header style={{ width: '20%' }}>Status</Header>
            <Header style={{ width: '20%' }}>JSON Token</Header>
          </tr>
        </TableHead>
        <TableBody>
          {creditTickets.map(ticketItem => {
            const ticketHeight = ethers.BigNumber.from(ticketItem.height)
            const heightDiff = ticketHeight.sub(currentHeight)
            const currentAmount = heightDiff.gt(0) ? heightDiff : ethers.BigNumber.from(0)
            const parsedTicketHeight = formatUnits(ticketHeight, token.decimals)
            const parsedCurrentAmount = formatUnits(currentAmount, token.decimals)
            return (
              <tr key={ticketItem.id}>
                <Cell>{`#${ticketItem.id}`}</Cell>
                <Cell>{parsedTicketHeight}</Cell>
                <Cell>{parsedCurrentAmount}</Cell>
                <Cell>
                  <TicketStatus ticketHeight={ticketHeight} status={ticketItem.status} expired={expired} currentHeight={currentHeight} />
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
  status: CreditTicketStatus
  expired: boolean
  ticketHeight: BigNumber
  currentHeight: BigNumber
}

export const TicketStatus = ({ status, ticketHeight, currentHeight }: TicketStatusProps) => {
  if (status === CreditTicketStatus.EXPIRED) {
    return <span className={`text-gray-500 bg-gray-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Expired</span>
  } else if (status === CreditTicketStatus.REFUNDED) {
    return <span className={`text-gray-500 bg-gray-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Refunded</span>
  } else if (status === CreditTicketStatus.REDEEMED) {
    return <span className={`text-gray-500 bg-gray-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Redeemed</span>
  } else if (ticketHeight.lte(currentHeight)) {
    return <span className={`text-red-500 bg-red-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Insufficient</span>
  } else {
    return <span className={`text-green-500 bg-green-500/10 py-1 px-2 rounded-full w-fit h-fit`}>Redeemable</span>
  }
}

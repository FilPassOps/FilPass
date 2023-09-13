import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline'
import { Button } from 'components/shared/Button'
import { IsVerified } from 'components/shared/IsVerified'
import { Cell, Header, Table, TableBody, TableHead } from 'components/shared/Table'
import { WalletAddress } from 'components/shared/WalletAddress'
import { stringify } from 'csv-stringify/sync'
import JsFileDownload from 'js-file-download'
import { api } from 'lib/api'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { PLATFORM_NAME } from 'system.config'

interface UserWalletListProps {
  data?: any[]
  totalItems: number
}

interface UserWallet {
  id: string
  address: string
  user: {
    email: string
  }
  verification?: {
    isVerified: boolean
  }
  createdAt: string
}

export const UserWalletList = ({ data = [], totalItems }: UserWalletListProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownloadCsv = async () => {
    setIsLoading(true)
    const {
      data: { wallets },
    } = await api.get<{ wallets: UserWallet[] }>(`/users/find-all-wallets?size=${totalItems}`)
    const csvTemplate = stringify(
      [
        ['User Email', 'Wallet Address', 'Is Verified', 'Creation Time'],
        ...wallets.map(wallet => [
          wallet.user.email,
          wallet.address,
          `${Boolean(wallet.verification?.isVerified)}`,
          `${DateTime.fromISO(wallet.createdAt).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}`,
        ]),
      ],
      {
        delimiter: ',',
      },
    )

    const blob = new Blob([csvTemplate])
    setIsLoading(false)
    return JsFileDownload(blob, `${PLATFORM_NAME.toLowerCase()}_user_address_${DateTime.now().toFormat("yyyy-MM-dd_hh'h'mm'm'ss's'")}.csv`)
  }

  return (
    <div className="flex flex-col">
      <Table style={{ display: 'table' }}>
        <TableHead>
          <tr>
            <Header style={{ width: '50%' }}>User Email</Header>
            <Header>Wallet Address</Header>
            <Header>Is Verified</Header>
            <Header style={{ minWidth: 200 }}>
              <Button onClick={handleDownloadCsv} loading={isLoading} disabled={isLoading}>
                <div className="flex items-center">
                  <ArrowDownOnSquareIcon className="h-4 mr-2" />
                  Download CSV
                </div>
              </Button>
            </Header>
          </tr>
        </TableHead>
        <TableBody>
          {data.map(wallet => (
            <tr key={wallet.id}>
              <Cell className="break-all">{wallet.user.email}</Cell>
              <Cell>
                <WalletAddress address={wallet.address} enableVerifiedIcon={false} blockchain={wallet.blockchain.name} walletSize="full" />
              </Cell>
              <Cell className="break-all">
                <IsVerified isVerified={wallet.verification?.isVerified} />
              </Cell>
              <Cell></Cell>
            </tr>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

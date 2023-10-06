import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline'
import { Button } from 'components/shared/Button'
import { Cell, Header, Table, TableBody, TableHead } from 'components/shared/Table'
import { WalletAddress } from 'components/shared/WalletAddress'
import { stringify } from 'csv-stringify/sync'
import JsFileDownload from 'js-file-download'
import { api } from 'lib/api'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { AppConfig } from 'system.config'

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
        ['User Email', 'Wallet Address', 'Creation Time'],
        ...wallets.map(wallet => [
          wallet.user.email,
          wallet.address,
          `${DateTime.fromISO(wallet.createdAt).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}`,
        ]),
      ],
      {
        delimiter: ',',
      },
    )

    const blob = new Blob([csvTemplate])
    setIsLoading(false)
    return JsFileDownload(
      blob,
      `${AppConfig.app.name.toLowerCase()}_user_address_${DateTime.now().toFormat("yyyy-MM-dd_hh'h'mm'm'ss's'")}.csv`,
    )
  }

  return (
    <div className="flex flex-col">
      <Table style={{ display: 'table' }}>
        <TableHead>
          <tr>
            <Header style={{ width: '50%' }}>User Email</Header>
            <Header>Wallet Address</Header>
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
                <WalletAddress address={wallet.address} blockchain={wallet.blockchain.name} shortenLength="short" className="sm:hidden" />
                <WalletAddress
                  address={wallet.address}
                  label={wallet.name}
                  blockchain={wallet.blockchain.name}
                  className="hidden sm:flex"
                />
              </Cell>
              <Cell></Cell>
            </tr>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

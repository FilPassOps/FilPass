import { ClipboardIcon } from '@heroicons/react/24/outline'
import { Button, LinkButton } from 'components/Shared/Button'
import { AppConfig } from 'config/system'
import { ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { UserCreditItem } from 'pages/transfer-credits'

interface TransferCreditListProps {
  userCreditItems: UserCreditItem[]
}

export const TransferCreditList = ({ userCreditItems }: TransferCreditListProps) => {
  const fil = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')

  return (
    <div className="flex flex-col gap-4">
      {userCreditItems.length === 0 && (
        <div className="flex justify-center items-center">
          <p className="text-gray-600">No credits found</p>
        </div>
      )}
      {userCreditItems.map(item => {
        const currentHeight = ethers.BigNumber.from(item.totalWithdrawals).add(item.totalRefunds)
        const totalHeight = ethers.BigNumber.from(item.totalHeight)

        const currentCredit = totalHeight.sub(currentHeight)

        const hasCredits = currentCredit.gt(0)

        const parsedCurrentHeight = formatUnits(currentCredit, fil.decimals)

        return (
          <div key={item.id} className="bg-white rounded-lg shadow-md">
            {item.isRefundStarted && hasCredits && (
              <div className="text-gamboge-orange bg-papaya-whip p-4 rounded-t-lg" role="alert">
                <p className="font-bold">Attention</p>
                <p>
                  This credit has expired on {new Date(item.withdrawExpiresAt).toLocaleString()}. <br />
                  You can only refund your credits.
                </p>
              </div>
            )}
            {!hasCredits && (
              <div className="text-gamboge-orange bg-papaya-whip p-4 rounded-t-lg" role="alert">
                <p className="font-bold">Attention</p>
                <p>
                  You currently have <strong>0</strong> credits. Please buy credits to continue using the service with this Storage
                  Provider.
                </p>
              </div>
            )}
            <div className="py-5 px-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-deep-koamaru mb-2">
                  Storage Provider:{' '}
                  {item.creditTransactions[0].storageProvider.walletAddress.length > 30
                    ? `${item.creditTransactions[0].storageProvider.walletAddress.slice(
                        0,
                        5,
                      )}...${item.creditTransactions[0].storageProvider.walletAddress.slice(-5)}`
                    : item.creditTransactions[0].storageProvider.walletAddress}
                </h2>
                <div className="text-right">
                  <p className="text-gray-600">Usage Expires on:</p>
                  <p className={'text-sm text-gray-500'}>{new Date(item.withdrawExpiresAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-gray-600">Current Credits:</p>
                  <p className="text-xl font-bold text-deep-koamaru">{parsedCurrentHeight} Credits</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Credits Token:</p>
                  {hasCredits ? (
                    <div className="flex gap-2 items-center">
                      <p
                        title={item.currentToken?.token}
                        className="text-xl font-bold text-deep-koamaru"
                      >{`${item.currentToken?.token.slice(0, 5)}...${item.currentToken?.token.slice(-5)}`}</p>
                      <Button
                        variant="none"
                        className="p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(item.currentToken?.token ?? '')
                          // TODO: Add toast notification or copied message
                        }}
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    '-'
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <LinkButton href={`/transfer-credits/${item.id}`} variant="secondary" className="w-fit">
                    <p>View Details</p>
                  </LinkButton>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

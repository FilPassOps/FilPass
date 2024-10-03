import { ClipboardIcon } from '@heroicons/react/24/outline'
import Big from 'big.js'
import { Button, LinkButton } from 'components/Shared/Button'
import { AppConfig } from 'config/system'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { UserCreditItem } from 'pages/transfer-credits'

interface TransferCreditListProps {
  userCreditItems: UserCreditItem[]
  setSelectedUserCreditId: (id: number) => void
  setSplitTokensModalOpen: (open: boolean) => void
}

export const TransferCreditList = ({ userCreditItems, setSelectedUserCreditId, setSplitTokensModalOpen }: TransferCreditListProps) => {
  const usdc = AppConfig.network.getTokenBySymbolAndBlockchainName('USDC', 'Ethereum')

  return (
    <div className="flex flex-col gap-4">
      {userCreditItems.length === 0 && (
        <div className="flex justify-center items-center">
          <p className="text-gray-600">No credits found</p>
        </div>
      )}
      {userCreditItems.map(item => {
        const currentHeight = Big(item.totalWithdrawals).plus(item.totalRefunds).toString()
        const parsedCurrentHeight = parseUnits(currentHeight, usdc.decimals)
        const totalHeight = parseUnits(item.totalHeight!, usdc.decimals)

        const currentCredit = totalHeight.sub(parsedCurrentHeight)

        return (
          <div key={item.id} className="bg-white rounded-lg shadow-md">
            {item.isWithdrawExpired && (
              <div className="text-gamboge-orange bg-papaya-whip p-4 rounded-t-lg" role="alert">
                <p className="font-bold">Attention</p>
                <p>
                  This credit has expired on {new Date(item.withdrawExpiresAt).toLocaleString()}. <br />
                  You can only refund your credits.
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
                  <p className="text-gray-600">Current Balance:</p>
                  <p className="text-xl font-bold text-deep-koamaru">{formatUnits(currentCredit, usdc.decimals)} Credits</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Balance Token:</p>
                  <div className="flex gap-2 items-center">
                    <p title={item.currentToken?.token} className="text-xl font-bold text-deep-koamaru">{`${item.currentToken?.token.slice(
                      0,
                      5,
                    )}...${item.currentToken?.token.slice(-5)}`}</p>
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
                </div>
                <div className="flex gap-2 justify-end">
                  <LinkButton href={`/transfer-credits/${item.id}`} variant="secondary" className="w-fit">
                    <p>View Details</p>
                  </LinkButton>
                  <Button
                    onClick={() => {
                      setSelectedUserCreditId(item.id)
                      setSplitTokensModalOpen(true)
                    }}
                    variant="primary"
                    className="w-fit"
                    disabled={item.isWithdrawExpired}
                    toolTipText={item.isWithdrawExpired ? 'This credit has expired' : ''}
                  >
                    <p>Split Tokens</p>
                  </Button>
                  <Button
                    variant="primary"
                    className="w-fit"
                    disabled={!item.isWithdrawExpired || !item.isRefundStarted}
                    toolTipText={
                      !item.isWithdrawExpired
                        ? ' This credit has not expired yet'
                        : !item.isRefundStarted
                        ? 'This credit cannot be refunded yet'
                        : ''
                    }
                  >
                    Refund Credits
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

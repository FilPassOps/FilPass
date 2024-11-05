import { LinkButton } from 'components/Shared/Button'
import { AppConfig } from 'config/system'
import { ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { UserCreditItem } from 'pages/transfer-credits'

interface TransferCreditListProps {
  userCreditItems: UserCreditItem[]
}

export const TransferCreditList = ({ userCreditItems }: TransferCreditListProps) => {
  const { token } = AppConfig.network.getFilecoin()

  return (
    <div className="flex flex-col gap-4">
      {userCreditItems.length === 0 && (
        <div className="flex justify-center items-center">
          <p className="text-gray-600">No channels found</p>
        </div>
      )}
      {userCreditItems.map(item => {
        const currentHeight = ethers.BigNumber.from(item.totalWithdrawals).add(item.totalRefunds)
        const totalHeight = ethers.BigNumber.from(item.totalHeight)

        const currentCredit = totalHeight.sub(currentHeight)

        const hasCredits = currentCredit.gt(0)

        const parsedCurrentHeight = formatUnits(currentCredit, token.decimals)

        return (
          <div key={item.id} className="bg-white rounded-lg shadow-md">
            {item.isRefundStarted && hasCredits && (
              <div className="text-gamboge-orange bg-papaya-whip p-4 rounded-t-lg" role="alert">
                <p className="font-bold">Attention</p>
                <p>
                  This credit has expired on {new Date(item.withdrawExpiresAt).toLocaleString()}. <br />
                  You can only refund your credits or top up to continue using the service with this Receiver.
                </p>
              </div>
            )}
            {!hasCredits && (
              <div className="text-gamboge-orange bg-papaya-whip p-4 rounded-t-lg" role="alert">
                <p className="font-bold">Attention</p>
                <p>
                  You currently have <strong>0</strong> credits. Please top up your credits to continue using the service with this
                  Receiver.
                </p>
              </div>
            )}
            <div className="py-5 px-6">
              <div className="flex justify-between w-full flex-col md:flex-row gap-2 pb-2">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold text-deep-koamaru mb-2">
                    Receiver:{' '}
                    {item.creditTransactions[0].receiver.walletAddress.length > 30
                      ? `${item.creditTransactions[0].receiver.walletAddress.slice(
                          0,
                          5,
                        )}...${item.creditTransactions[0].receiver.walletAddress.slice(-5)}`
                      : item.creditTransactions[0].receiver.walletAddress}
                  </h2>

                  <div>
                    <p className="text-gray-600 font-semibold">Contract:</p>
                    <p className="text-deep-koamaru">{item.contract.address}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Current Credits:</p>
                    <p className="text-deep-koamaru">{parsedCurrentHeight} Credits</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-left md:text-right">
                    <p className="text-gray-600">Credits Locked Until:</p>
                    <p className={'text-sm text-gray-500'}>{new Date(item.withdrawExpiresAt).toLocaleString()}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-gray-600">Refund Starts on:</p>
                    <p className={'text-sm text-gray-500'}>{new Date(item.refundStartsAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <LinkButton href={`/transfer-credits/${item.id}`} variant="secondary" className="w-fit">
                  <p>View Details</p>
                </LinkButton>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

import { Layout } from 'components/Layout'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { Button, LinkButton } from 'components/Shared/Button'
import { ReactElement, useState } from 'react'
import { AppConfig } from 'config/system'
import { getUserCreditById } from 'domain/transfer-credits/get-user-credit-by-id'
import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'
import { Divider } from 'components/Shared/Divider'
import { SplitTokensModal } from 'components/User/Modal/SplitTokensModal'
import { api } from 'lib/api'
import { useAlertDispatcher } from 'components/Layout/Alerts'
import { getSplitTokensGroup } from 'domain/transfer-credits/get-split-tokens-group'
import { SplitTokenGroupList } from 'components/User/SplitTokenGroupList'
import { ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useContract } from 'components/Web3/useContract'
import { ErrorAlert } from 'components/Controller/MetaMaskPayment/Alerts'
import { getPaymentErrorMessage } from 'components/Web3/utils'
import { WithMetaMaskButton } from 'components/Web3/MetaMaskProvider'

export interface CreditToken {
  id: number
  height: string
  token: string
  redeemable: boolean
}

interface CreditTransaction {
  id: number
  storageProvider: {
    walletAddress: string
  }
  status: string
  transactionHash: string
}

export interface UserCreditDetails {
  id: number
  totalHeight: string
  totalWithdrawals: string
  totalRefunds: string
  updatedAt: Date
  withdrawStartsAt: Date
  withdrawExpiresAt: Date
  refundStartsAt: Date
  amount: string
  creditTransactions: CreditTransaction[]
  creditTokens: CreditToken[]
}

export interface SplitTokenGroup {
  splitGroup: string
  totalTokens: number
  createdAt: Date
}

interface TransferCreditDetailsProps {
  data: {
    userCreditDetails: UserCreditDetails
    splitTokensGroup: SplitTokenGroup[]
  }
}

const TransferCreditDetails = ({ data }: TransferCreditDetailsProps) => {
  const { dispatch, close } = useAlertDispatcher()
  const { refundAmount } = useContract()

  const { userCreditDetails } = data
  const [splitTokensModalOpen, setSplitTokensModalOpen] = useState(false)
  const [isRefundLoading, setIsRefundLoading] = useState(false)

  const token = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')
  const network = AppConfig.network.getChainByToken(token)!

  const isWithdrawExpired = new Date(userCreditDetails.withdrawExpiresAt) < new Date()
  const isRefundStarted = new Date(userCreditDetails.refundStartsAt) < new Date()

  const currentHeight = ethers.BigNumber.from(userCreditDetails.totalWithdrawals).add(userCreditDetails.totalRefunds)
  const currentCredits = ethers.BigNumber.from(userCreditDetails.totalHeight).sub(currentHeight)

  const parsedCurrentCredits = formatUnits(currentCredits, token.decimals)

  const hasCredits = currentCredits.gt(0)

  const handleRefund = async () => {
    try {
      setIsRefundLoading(true)
      const systemWalletAddress = process.env.NEXT_PUBLIC_SYSTEM_WALLET_ADDRESS

      if (!systemWalletAddress) {
        dispatch({
          type: 'error',
          title: 'Refund failed',
          config: {
            closeable: true,
          },
          body: () => (
            <ErrorAlert handleClose={() => close()}>
              <span className="text-sm text-gray-600 text-center first-letter:uppercase pt-2">
                Something went wrong with the oracle wallet. Please contact support if.
              </span>
            </ErrorAlert>
          ),
        })
        return false
      }

      const result = await refundAmount(systemWalletAddress, userCreditDetails.creditTransactions[0].storageProvider.walletAddress)

      if (result) {
        await api.post('/transfer-credits/refund-credits', {
          hash: result.hash,
          id: userCreditDetails.id,
        })

        dispatch({
          type: 'success',
          title: 'Refund transaction sent',
          config: {
            closeable: true,
          },
          body: () => (
            <>
              <p className="text-sm text-gray-500 mb-4 text-center">
                Your refund transaction has been successfully sent and is being processed.
              </p>
              <div className="mt-4 text-sm text-gray-500 text-center mb-4">
                <a
                  href={`${network?.blockExplorer.url}/${result.hash}`}
                  onClick={() => close()}
                  rel="noreferrer"
                  target="_blank"
                  className="underline text-green-700"
                >
                  Check the message
                </a>
              </div>
            </>
          ),
        })
      }
    } catch (error: any) {
      dispatch({
        type: 'error',
        title: 'Refund failed',
        config: {
          closeable: true,
        },
        body: () => (
          <ErrorAlert handleClose={() => close()}>
            <span className="text-sm text-gray-600 text-center first-letter:uppercase pt-2">{getPaymentErrorMessage(error)}</span>
          </ErrorAlert>
        ),
      })
      return false
    } finally {
      setIsRefundLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>{`Credit Details - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="container w-full max-w-3xl mx-auto">
        <div className="py-6">
          {isRefundStarted && hasCredits && (
            <div className="mb-7 text-sm rounded-lg p-4 space-y-4 text-gamboge-orange bg-papaya-whip">
              <p className="font-bold">Attention</p>
              <p>
                This credit has expired on <strong>{new Date(userCreditDetails.withdrawExpiresAt).toLocaleString()}</strong>. <br />
                You can only refund your credits.
              </p>
            </div>
          )}
          {!hasCredits && (
            <div className="mb-7 text-sm rounded-lg p-4 space-y-4 text-gamboge-orange bg-papaya-whip">
              <p className="font-bold">Attention</p>
              <p>
                You currently have <strong>0</strong> credits. Please buy top up your credits to continue using the service with this
                Receiver.
              </p>
            </div>
          )}

          <dl className={`sm:grid sm:grid-cols-2 sm:grid-flow-col `}>
            <div>
              <dt className="text-gray-900 font-medium text-lg">Receiver Wallet</dt>
              <dd className="text-sm text-gray-500">{userCreditDetails.creditTransactions[0].storageProvider.walletAddress}</dd>
            </div>

            <div className="mt-4 sm:mt-0 text-sm text-gray-500">
              <div className="flex sm:justify-end">
                <dt>Credits Locked Until: </dt>
                <dd>
                  <Timestamp
                    date={new Date(userCreditDetails.withdrawExpiresAt).toISOString()}
                    format={DateTime.DATETIME_SHORT_WITH_SECONDS}
                  />
                </dd>
              </div>
              <div className="flex sm:justify-end">
                <dt>Refund Starts on: </dt>
                <dd>
                  <Timestamp
                    date={new Date(userCreditDetails.refundStartsAt).toISOString()}
                    format={DateTime.DATETIME_SHORT_WITH_SECONDS}
                  />
                </dd>
              </div>
            </div>
          </dl>

          <Divider className="my-8" />

          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Credit Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Current Credits:</p>
              <p className=" text-deep-koamaru">{parsedCurrentCredits}</p>
            </div>
          </div>
        </div>

        <div className="">
          <Divider className="my-8" />
          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Voucher Groups</h2>
          <SplitTokenGroupList splitGroup={data.splitTokensGroup} userCreditId={userCreditDetails.id} />
        </div>
        <Divider className="my-8" />
        <div className="py-6 flex items-center justify-center gap-4">
          <LinkButton href="/transfer-credits" className="w-fit" variant="outline" disabled={isRefundLoading}>
            Back
          </LinkButton>
          <Button
            onClick={() => {
              setSplitTokensModalOpen(true)
            }}
            variant="primary"
            className="w-fit"
            disabled={isWithdrawExpired || isRefundLoading}
            toolTipText={isWithdrawExpired ? 'This credit has expired' : ''}
          >
            <p>Create Vouchers</p>
          </Button>

          <LinkButton
            href={`/transfer-credits/buy?to=${userCreditDetails.creditTransactions[0].storageProvider.walletAddress}`}
            variant="primary"
            className="w-fit"
            disabled={isRefundLoading}
          >
            Top Up
          </LinkButton>
          <div className="w-fit">
            <WithMetaMaskButton
              targetChainId={network.chainId}
              onClick={handleRefund}
              connectWalletLabel="Connect MetaMask to refund"
              switchChainLabel="Switch network to refund"
              variant="red"
              disabled={!isWithdrawExpired || !isRefundStarted || !hasCredits}
              toolTipText={
                !isWithdrawExpired
                  ? ' This credit has not expired yet'
                  : !isRefundStarted
                  ? 'This credit cannot be refunded yet'
                  : !hasCredits
                  ? 'No more credits to refund'
                  : ''
              }
            >
              Refund Credits
            </WithMetaMaskButton>
          </div>
        </div>
      </div>
      <SplitTokensModal
        onModalClosed={() => setSplitTokensModalOpen(false)}
        open={splitTokensModalOpen}
        userCreditId={userCreditDetails.id.toString()}
      />
    </>
  )
}

export default TransferCreditDetails

TransferCreditDetails.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="Credit Details">{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ params, user }: any) => {
  const { data } = await getUserCreditById({ id: params.id, userId: user.id })

  const userCreditDetails = data ? JSON.parse(JSON.stringify(data)) : null

  const { data: splitTokensGroup } = await getSplitTokensGroup({ userCreditId: userCreditDetails.id })

  return {
    props: {
      data: {
        userCreditDetails,
        splitTokensGroup: JSON.parse(JSON.stringify(splitTokensGroup)),
      },
    },
  }
})

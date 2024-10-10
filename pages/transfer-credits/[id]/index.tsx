import { Layout } from 'components/Layout'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { Button, LinkButton } from 'components/Shared/Button'
import { CheckCircleIcon, ClipboardIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { ReactElement, useState } from 'react'
import { AppConfig } from 'config/system'
import { getUserCreditById } from 'domain/transfer-credits/get-user-credit-by-id'
import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'
import { Divider } from 'components/Shared/Divider'
import { SplitTokensModal } from 'components/User/Modal/SplitTokensModal'
import { api } from 'lib/api'
import { useAlertDispatcher } from 'components/Layout/Alerts'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { getSplitTokensGroup } from 'domain/transfer-credits/get-split-tokens-group'
import { SplitTokenGroupList } from 'components/User/SplitTokenGroupList'
import { ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'

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
  currentToken: {
    token: string
    height: string
  }
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
  const { dispatch } = useAlertDispatcher()

  const { userCreditDetails } = data
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [splitTokensModalOpen, setSplitTokensModalOpen] = useState(false)
  const [isRefundLoading, setIsRefundLoading] = useState(false)

  const fil = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')

  const isWithdrawExpired = new Date(userCreditDetails.withdrawExpiresAt) < new Date()
  const isRefundStarted = new Date(userCreditDetails.refundStartsAt) < new Date()

  const currentHeight = ethers.BigNumber.from(userCreditDetails.totalWithdrawals).add(userCreditDetails.totalRefunds)
  const currentCredits = ethers.BigNumber.from(userCreditDetails.totalHeight).sub(currentHeight)

  const parsedCurrentCredits = formatUnits(currentCredits, fil.decimals)
  const parsedUsedCredits = formatUnits(userCreditDetails.totalWithdrawals, fil.decimals)
  const parsedRefundedCredits = formatUnits(userCreditDetails.totalRefunds, fil.decimals)

  const hasCredits = currentCredits.gt(0)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleRefund = async () => {
    setIsRefundLoading(true)
    const { error } = await api.post('transfer-credits/refund-credits', {
      userCreditId: userCreditDetails.id,
    })

    if (error) {
      dispatch({
        title: 'Error refunding credits',
        body: () => <p>{errorsMessages.something_went_wrong.message}</p>,
        icon: () => <XCircleIcon className="text-red-500 h-12 w-12 mb-6" />,
        config: {
          closeable: true,
        },
      })
    } else {
      dispatch({
        title: 'Credits refunded',
        body: () => <p>Credits refunded</p>,
        icon: () => <CheckCircleIcon className="text-green-500 h-12 w-12 mb-6" />,
        config: {
          closeable: true,
        },
      })
    }
    setIsRefundLoading(false)
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
                You currently have <strong>0</strong> credits. Please buy credits to continue using the service with this Storage Provider.
              </p>
            </div>
          )}

          <dl className={`sm:grid sm:grid-cols-2 sm:grid-flow-col `}>
            <div>
              <dt className="text-gray-900 font-medium text-lg">Storage Provider Wallet</dt>
              <dd className="text-sm text-gray-500">{userCreditDetails.creditTransactions[0].storageProvider.walletAddress}</dd>
            </div>

            <div className="mt-4 sm:mt-0 text-sm text-gray-500">
              <div className="flex sm:justify-end">
                <dt>Usage Expires on: </dt>
                <dd>
                  <Timestamp date={new Date(userCreditDetails.withdrawExpiresAt).toISOString()} format={DateTime.DATE_SHORT} />
                </dd>
              </div>
              <div className="flex sm:justify-end">
                <dt>Refund Starts on: </dt>
                <dd>
                  <Timestamp date={new Date(userCreditDetails.refundStartsAt).toISOString()} format={DateTime.DATE_SHORT} />
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

            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Current Credits Token:</p>
              {hasCredits ? (
                <div className="flex items-center gap-2">
                  <p className="text-deep-koamaru">{`${userCreditDetails.currentToken.token.slice(
                    0,
                    6,
                  )}...${userCreditDetails.currentToken.token.slice(-6)}`}</p>
                  <Button variant="none" className="p-0" onClick={() => copyToClipboard(userCreditDetails.currentToken.token, 'token')}>
                    <ClipboardIcon className="h-4 w-4" />
                  </Button>
                  {copiedField === 'token' && <span className="text-green-500 text-sm">Copied!</span>}
                </div>
              ) : (
                '-'
              )}
              <div className="flex items-center gap-2"></div>
            </div>

            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Used Credits:</p>
              <p className=" text-deep-koamaru">{parsedUsedCredits}</p>
            </div>

            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Refunded Credits:</p>
              <p className=" text-deep-koamaru">{parsedRefundedCredits}</p>
            </div>
          </div>
        </div>

        <div className="">
          <Divider className="my-8" />
          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Split Tokens Groups</h2>
          <SplitTokenGroupList splitGroup={data.splitTokensGroup} userCreditId={userCreditDetails.id} />
        </div>
        <Divider className="my-8" />
        <div className="py-6 flex items-center justify-center gap-4">
          <LinkButton href="/transfer-credits" className="w-fit" variant="outline">
            Back
          </LinkButton>
          <Button
            onClick={() => {
              setSplitTokensModalOpen(true)
            }}
            variant="primary"
            className="w-fit"
            disabled={isWithdrawExpired}
            toolTipText={isWithdrawExpired ? 'This credit has expired' : ''}
          >
            <p>Split Tokens</p>
          </Button>
          <Button
            variant="primary"
            className="w-fit"
            disabled={!isWithdrawExpired || !isRefundStarted || !hasCredits}
            onClick={handleRefund}
            loading={isRefundLoading}
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
          </Button>
          <LinkButton
            href={`/transfer-credits/buy?to=${userCreditDetails.creditTransactions[0].storageProvider.walletAddress}`}
            variant="primary"
            className="w-fit"
          >
            Buy Credits
          </LinkButton>
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

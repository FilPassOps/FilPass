import { Layout } from 'components/Layout'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { Button, LinkButton } from 'components/Shared/Button'
import { ClipboardIcon } from '@heroicons/react/24/outline'
import { ReactElement, useState } from 'react'
import { AppConfig } from 'config/system'
import { getUserCreditById } from 'domain/transfer-credits/get-user-credit-by-id'
import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'
import { Divider } from 'components/Shared/Divider'
import { SplitTokensModal } from 'components/User/Modal/SplitTokensModal'
import { BlockExplorerLink } from 'components/Shared/BlockExplorerLink'
import { TokenList } from 'components/User/TokenList'
import Big from 'big.js'

export interface CreditToken {
  id: number
  height: string
  token: string
  lane: string
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

interface UserCreditDetails {
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

interface TransferCreditDetailsProps {
  data: {
    userCreditDetails: UserCreditDetails
  }
}

const TransferCreditDetails = ({ data }: TransferCreditDetailsProps) => {
  const ethereum = AppConfig.network.getChainByName('Ethereum')

  const { userCreditDetails } = data
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [splitTokensModalOpen, setSplitTokensModalOpen] = useState(false)
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const isWithdrawExpired = new Date(userCreditDetails.withdrawExpiresAt) < new Date()
  const isRefundStarted = new Date(userCreditDetails.refundStartsAt) < new Date()

  const currentHeight = Big(userCreditDetails.totalWithdrawals).plus(userCreditDetails.totalRefunds)

  return (
    <>
      <Head>
        <title>{`Credit Details - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="container w-full max-w-3xl mx-auto">
        <div className="py-6">
          {isWithdrawExpired && (
            <div className="mb-7 text-sm rounded-lg p-4 space-y-4 text-gamboge-orange bg-papaya-whip">
              <p className="font-bold">Attention</p>
              <p>
                This credit has expired on <strong>{new Date(userCreditDetails.withdrawExpiresAt).toLocaleString()}</strong>. <br />
                You can only withdraw your credits.
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
                <dt>Last Updated: </dt>
                <dd>
                  <Timestamp date={new Date(userCreditDetails.updatedAt).toISOString()} format={DateTime.DATE_SHORT} />
                </dd>
              </div>
              <div className="flex sm:justify-end">
                <dt>Usage Expires on: </dt>
                <dd>
                  <Timestamp date={new Date(userCreditDetails.withdrawExpiresAt).toISOString()} format={DateTime.DATE_SHORT} />
                </dd>
              </div>
            </div>
          </dl>

          <Divider className="my-8" />

          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Credit Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Current Height:</p>
              <p className=" text-deep-koamaru">
                {currentHeight.toString()}/{userCreditDetails.totalHeight}
              </p>
            </div>

            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Total Height Token:</p>
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
            </div>

            <div className="col-span-2">
              <p className="text-gray-600 font-semibold">Current Credits:</p>
              <p className=" text-deep-koamaru">{userCreditDetails.totalHeight} Credits</p>
            </div>

            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Usage Starts on:</p>
              <p className=" text-deep-koamaru">
                {DateTime.fromISO(new Date(userCreditDetails.withdrawStartsAt).toISOString()).toLocaleString(DateTime.DATE_SHORT)}
              </p>
            </div>

            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Usage Ends on:</p>
              <p className=" text-deep-koamaru">
                {DateTime.fromISO(new Date(userCreditDetails.withdrawExpiresAt).toISOString()).toLocaleString(DateTime.DATE_SHORT)}
              </p>
            </div>

            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Refund Starts on:</p>
              <p className=" text-deep-koamaru">
                {DateTime.fromISO(new Date(userCreditDetails.refundStartsAt).toISOString()).toLocaleString(DateTime.DATE_SHORT)}
              </p>
            </div>


            {/* <div>
              <p className="text-gray-600 font-semibold">Transaction Hash:</p>
              <div className="flex items-center gap-2">
                <p className="text-deep-koamaru">{`${userCreditDetails.creditTransaction.transactionHash.slice(
                  0,
                  6,
                )}...${userCreditDetails.creditTransaction.transactionHash.slice(-6)}`}</p>
                <Button
                  variant="none"
                  className="p-0"
                  onClick={() => copyToClipboard(userCreditDetails.creditTransaction.transactionHash, 'hash')}
                >
                  <ClipboardIcon className="h-4 w-4" />
                </Button>
                {copiedField === 'hash' && <span className="text-green-500 text-sm">Copied!</span>}
              </div>
            </div> */}
            {/* <div>
              <p className="text-gray-600 font-semibold">Explorer:</p>
              <BlockExplorerLink
                blockExplorerName={ethereum.blockExplorer.name}
                blockExplorerUrl={ethereum.blockExplorer.url}
                transactionHash={userCreditDetails.creditTransaction.transactionHash}
              />
            </div> */}
          </div>
        </div>

        <div className="">
          <Divider className="my-8" />
          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Split Tokens</h2>

          <TokenList
            creditTokens={userCreditDetails.creditTokens}
            maxHeight={userCreditDetails.totalHeight}
            currentHeight={currentHeight}
          />
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
            disabled={!isWithdrawExpired || !isRefundStarted}
            toolTipText={
              !isWithdrawExpired ? ' This credit has not expired yet' : !isRefundStarted ? 'This credit cannot be refunded yet' : ''
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

  return {
    props: {
      data: {
        userCreditDetails,
      },
    },
  }
})

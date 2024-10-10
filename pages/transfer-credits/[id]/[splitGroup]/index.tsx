import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { Button, LinkButton } from 'components/Shared/Button'
import { ReactElement, useState } from 'react'
import { AppConfig } from 'config/system'
import { getUserCreditById } from 'domain/transfer-credits/get-user-credit-by-id'
import { Divider } from 'components/Shared/Divider'
import { TokenList } from 'components/User/TokenList'
import { Layout } from 'components/Layout'
import { UserCreditDetails } from '..'
import { getTokensBySplitGroup } from 'domain/transfer-credits/get-tokens-by-split-group'
import { getItemsPerPage, PaginationWrapper } from 'components/Shared/PaginationWrapper'
import { ClipboardIcon } from '@heroicons/react/24/outline'
import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'
import { formatUnits } from 'ethers/lib/utils'
import { ethers } from 'ethers'

export interface CreditToken {
  id: number
  height: string
  token: string
  redeemable: boolean
}

interface TokenSplitGroupDetailsProps {
  data: {
    userCreditDetails: UserCreditDetails
    splitTokensGroup: CreditToken[]
  }
  totalItems: number
  pageSize: number
}

const TokenSplitGroupDetails = ({ data, totalItems, pageSize }: TokenSplitGroupDetailsProps) => {
  const { userCreditDetails, splitTokensGroup } = data
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fil = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')

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

  return (
    <>
      <Head>
        <title>{`Credit Details - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="container w-full max-w-3xl mx-auto">
        <div className="py-6">
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
          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Tokens</h2>
          <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
            <TokenList isOpen={true} creditTokens={splitTokensGroup} currentHeight={currentHeight} />
          </PaginationWrapper>
        </div>
        <Divider className="my-8" />
        <div className="py-6 flex items-center justify-center gap-4">
          <LinkButton href={`/transfer-credits/${userCreditDetails.id}`} className="w-fit" variant="outline">
            Back
          </LinkButton>
        </div>
      </div>
    </>
  )
}

export default TokenSplitGroupDetails

TokenSplitGroupDetails.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="Token Group Details">{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ params, user, query }: any) => {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  const { data } = await getUserCreditById({ id: params.id, userId: user.id })

  const userCreditDetails = data ? JSON.parse(JSON.stringify(data)) : null

  const { data: splitTokensGroup } = await getTokensBySplitGroup({
    splitGroup: params.splitGroup,
    userId: user.id,
    userCreditId: params.id,
    pageSize,
    page,
  })

  return {
    props: {
      data: {
        userCreditDetails,
        splitTokensGroup: JSON.parse(JSON.stringify(splitTokensGroup.splitTokens)),
      },
      totalItems: splitTokensGroup?.total ?? 0,
      pageSize: pageSize,
    },
  }
})

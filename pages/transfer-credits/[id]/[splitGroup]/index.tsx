import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { LinkButton } from 'components/Shared/Button'
import { ReactElement } from 'react'
import { AppConfig } from 'config/system'
import { getUserCreditById } from 'domain/transfer-credits/get-user-credit-by-id'
import { Divider } from 'components/Shared/Divider'
import { TokenList } from 'components/User/TokenList'
import { Layout } from 'components/Layout'
import { UserCreditDetails } from '..'
import { getTokensBySplitGroup } from 'domain/transfer-credits/get-tokens-by-split-group'
import { getItemsPerPage, PaginationWrapper } from 'components/Shared/PaginationWrapper'
import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'
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
  totalRedeemed: number
  pageSize: number
}

const TokenSplitGroupDetails = ({ data, totalItems, totalRedeemed, pageSize }: TokenSplitGroupDetailsProps) => {
  const { userCreditDetails, splitTokensGroup } = data

  const currentHeight = ethers.BigNumber.from(userCreditDetails.totalWithdrawals).add(userCreditDetails.totalRefunds)

  const totalInFlight = totalItems - totalRedeemed

  return (
    <>
      <Head>
        <title>{`Credit Details - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="container w-full max-w-3xl mx-auto">
        <div className="py-6">
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

          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Group Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Vouchers in Flight:</p>
              <p className=" text-deep-koamaru">{totalInFlight}</p>
            </div>

            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Vouchers Redeemed:</p>
              <p className=" text-deep-koamaru">{totalRedeemed}</p>
            </div>
          </div>
        </div>

        <div className="">
          <Divider className="my-8" />
          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Vouchers</h2>
          <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
            <TokenList
              isOpen={true}
              creditTokens={splitTokensGroup}
              currentHeight={currentHeight}
            />
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
  return <Layout title="Voucher Group Details">{page}</Layout>
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
      totalRedeemed: splitTokensGroup?.totalRedeemed ?? 0,
      pageSize: pageSize,
    },
  }
})

import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { LinkButton } from 'components/Shared/Button'
import { ReactElement } from 'react'
import { AppConfig } from 'config/system'
import { getUserCreditById } from 'domain/transfer-credits/get-user-credit-by-id'
import { Divider } from 'components/Shared/Divider'
import { Layout } from 'components/Layout'
import { UserCreditDetails } from '..'
import { getItemsPerPage, PaginationWrapper } from 'components/Shared/PaginationWrapper'
import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'
import { ethers } from 'ethers'
import { TicketList } from 'components/User/TicketList'
import { getTicketsBySplitGroupId } from 'domain/transfer-credits/get-tickets-by-split-group-id'

export interface CreditTicket {
  id: number
  height: string
  token: string
  redeemable: boolean
}

interface TicketSplitGroupDetailsProps {
  data: {
    userCreditDetails: UserCreditDetails
    splitTicketsGroup: CreditTicket[]
  }
  totalItems: number
  totalRedeemedInvalid: number
  pageSize: number
}

const TicketSplitGroupDetails = ({ data, totalItems, totalRedeemedInvalid, pageSize }: TicketSplitGroupDetailsProps) => {
  const { userCreditDetails, splitTicketsGroup } = data

  const currentHeight = ethers.BigNumber.from(userCreditDetails.totalWithdrawals).add(userCreditDetails.totalRefunds)

  const totalInFlight = totalItems - totalRedeemedInvalid

  return (
    <>
      <Head>
        <title>{`Credit Details - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="container w-full max-w-3xl mx-auto">
        <div className="py-6">
          <dl className={`sm:grid sm:grid-cols-2 sm:grid-flow-col items-center`}>
            <div>
              <div>
                <dt className="text-gray-900 font-medium">Receiver</dt>
                <dd className="text-sm text-gray-500">{userCreditDetails.creditTransactions[0].storageProvider.walletAddress}</dd>
              </div>
              <div>
                <dt className="text-gray-900 font-medium">Contract</dt>
                <dd className="text-sm text-gray-500">{userCreditDetails.contract.address}</dd>
              </div>
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
              <p className="text-gray-600 font-semibold">In Flight:</p>
              <p className=" text-deep-koamaru">{totalInFlight}</p>
            </div>

            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Redeemed/Invalid:</p>
              <p className=" text-deep-koamaru">{totalRedeemedInvalid}</p>
            </div>
          </div>
        </div>

        <div className="">
          <Divider className="my-8" />
          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Tickets</h2>
          <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
            <TicketList isOpen={true} creditTickets={splitTicketsGroup} currentHeight={currentHeight} />
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

export default TicketSplitGroupDetails

TicketSplitGroupDetails.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="Ticket Group Details">{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ params, user, query }: any) => {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  const { data } = await getUserCreditById({ id: params.id, userId: user.id })

  const userCreditDetails = data ? JSON.parse(JSON.stringify(data)) : null

  const { data: splitTicketsGroup } = await getTicketsBySplitGroupId({
    splitGroupId: params.splitGroup,
    userId: user.id,
    userCreditId: params.id,
    pageSize,
    page,
  })

  return {
    props: {
      data: {
        userCreditDetails,
        splitTicketsGroup: JSON.parse(JSON.stringify(splitTicketsGroup.splitTickets)),
      },
      totalItems: splitTicketsGroup?.total ?? 0,
      totalRedeemedInvalid: splitTicketsGroup?.totalRedeemedInvalid ?? 0,
      pageSize: pageSize,
    },
  }
})

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
import { getTicketsByTicketGroupId } from 'domain/transfer-credits/get-tickets-by-group-id'
import { CreditTicketStatus } from '@prisma/client'

export interface CreditTicket {
  id: number
  height: string
  token: string
  status: CreditTicketStatus
}

interface TicketGroupDetailsProps {
  data: {
    userCreditDetails: UserCreditDetails
    ticketGroup: CreditTicket[]
    expired: boolean
    expiresAt: string
    createdAt: string
  }
  totalItems: number
  totalRedeemed: number
  pageSize: number
}

const TicketGroupDetails = ({ data, totalItems, totalRedeemed, pageSize }: TicketGroupDetailsProps) => {
  const { userCreditDetails, ticketGroup, expired } = data

  const currentHeight = ethers.BigNumber.from(userCreditDetails.totalWithdrawals).add(userCreditDetails.totalRefunds)

  const totalInFlight = totalItems - totalRedeemed

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

            <div className="mt-4 sm:mt-0 text-gray-500 flex items-end flex-col">
              <div className="flex flex-col sm:justify-end text-end">
                <dt className="text-gray-900 font-medium">Credits Locked Until:</dt>
                <dd className="text-sm text-gray-500">
                  <Timestamp
                    date={new Date(userCreditDetails.withdrawExpiresAt).toISOString()}
                    format={DateTime.DATETIME_SHORT_WITH_SECONDS}
                  />
                </dd>
              </div>
              <div className="flex flex-col sm:justify-end text-end">
                <dt className="text-gray-900 font-medium">Refund Starts on:</dt>
                <dd className="text-sm text-gray-500">
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

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <p className="text-gray-600 font-semibold">In Flight:</p>
                <p className=" text-deep-koamaru">{totalInFlight}</p>
              </div>

              <div className="col-span-1">
                <p className="text-gray-600 font-semibold">Redeemed:</p>
                <p className=" text-deep-koamaru">{totalRedeemed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="">
          <Divider className="my-8" />
          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Tickets</h2>
          <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
            <TicketList isOpen={true} creditTickets={ticketGroup} expired={expired} currentHeight={currentHeight} />
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

export default TicketGroupDetails

TicketGroupDetails.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="Ticket Group Details">{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ params, user, query }: any) => {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  const { data } = await getUserCreditById({ id: params.id, userId: user.id })

  const userCreditDetails = data ? JSON.parse(JSON.stringify(data)) : null

  const { data: ticketGroup } = await getTicketsByTicketGroupId({
    ticketGroupId: params.ticketGroup,
    userId: user.id,
    userCreditId: params.id,
    pageSize,
    page,
  })

  return {
    props: {
      data: {
        userCreditDetails,
        ticketGroup: JSON.parse(JSON.stringify(ticketGroup.creditTickets)),
        expired: ticketGroup.expired,
        expiresAt: JSON.parse(JSON.stringify(ticketGroup.expiresAt)),
        createdAt: JSON.parse(JSON.stringify(ticketGroup.createdAt)),
      },
      totalItems: ticketGroup?.total ?? 0,
      totalRedeemed: ticketGroup?.totalRedeemed ?? 0,
      pageSize: pageSize,
    },
  }
})

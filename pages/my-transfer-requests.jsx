import { DocumentPlusIcon } from '@heroicons/react/24/solid'
import { statusFilterOptions } from 'components/Filters/constants'
import { Filters } from 'components/Filters/Filters'
import { Layout } from 'components/Layout'
import { LinkButton } from 'components/shared/Button'
import { checkItemsPerPage, PaginationWrapper } from 'components/shared/usePagination'
import TransferList from 'components/User/TransferList'
import { PLATFORM_NAME } from 'system.config'
import { findReceiverPrograms } from 'domain/programs/findReceiverPrograms'
import { getUserTransferRequests } from 'domain/transferRequest/getUserTransferRequests'
import { getDelegatedAddress } from 'lib/getDelegatedAddress'
import { getEthereumAddress } from 'lib/getEthereumAddress'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'

export default function Home({ data = [], pageSize, totalItems = 0, programs }) {
  return (
    <>
      <Head>
        <title>Home - {PLATFORM_NAME}</title>
      </Head>
      <div className="w-full">
        <div className="flex items-center justify-end md:justify-between gap-2 py-4">
          <div className="hidden md:flex items-center">
            <LinkButton href="/transfer-requests/create" className="shrink-0 w-fit">
              <div className="flex justify-center items-center gap-2">
                <DocumentPlusIcon className="h-5 w-5" />
                Create New Request
              </div>
            </LinkButton>
          </div>
          <div className="flex items-center">
            <Filters programs={programs} statusOptions={statusFilterOptions} />
          </div>
        </div>
        <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
          <TransferList data={data} />
        </PaginationWrapper>
      </div>
    </>
  )
}

Home.getLayout = function getLayout(page) {
  return <Layout title="My Transfer Requests">{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ query, user }) => {
  const { itemsPerPage, programId, number, team, sort, status, order, from, to, wallet } = query
  const pageSize = checkItemsPerPage(itemsPerPage) ? parseInt(itemsPerPage) : 100
  const page = parseInt(query.page) || 1

  const programIds =
    programId
      ?.toString()
      .split(',')
      .map(id => parseInt(id)) ?? undefined

  let fromDate, toDate

  if (from && to) {
    fromDate = new Date(parseInt(from.toString()))
    fromDate.setHours(0, 0, 0, 0)
    toDate = new Date(parseInt(to.toString()))
    toDate.setHours(23, 59, 59, 999)
  }

  const ethereumWallet = getEthereumAddress(wallet)?.fullAddress.toLowerCase()
  const delegatedAddress = getDelegatedAddress(wallet)?.fullAddress

  const wallets = [wallet, ethereumWallet, delegatedAddress].filter(Boolean)

  const {
    data: { requests, totalItems },
  } = await getUserTransferRequests({
    userId: user.id,
    page,
    size: pageSize,
    sort,
    order,
    programIds,
    requestNumber: number,
    status,
    team: team?.toString().split(','),
    from: fromDate,
    to: toDate,
    wallets,
  })

  const programs = await findReceiverPrograms(user.id)

  return {
    props: {
      user: {},
      data: JSON.parse(JSON.stringify(requests)),
      programs: JSON.parse(JSON.stringify(programs)),
      pageSize,
      totalItems: JSON.parse(JSON.stringify(totalItems)),
    },
  }
})

import { Layout } from 'components/Layout'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { AppConfig } from 'config/system'
import { ReactElement } from 'react'
import { TransactionList } from 'components/User/TransactionList'
import { Transaction } from 'domain/transfer-credits/get-user-transaction-credits-by-user-id'
import { getItemsPerPage, PaginationWrapper } from 'components/Shared/PaginationWrapper'
import useSWR from 'swr'
import { fetcher } from 'lib/fetcher'

interface TransactionHistoryData {
  transactions: Transaction[]
}

interface TransactionHistoryProps {
  data: TransactionHistoryData
  totalItems: number
  pageSize: number
  page: number
}

const TransactionHistory = ({ pageSize, page }: TransactionHistoryProps) => {
  const { data, error } = useSWR(
    `/transfer-credits/get-user-transaction-credits-by-user-id?currentPage=${page}&pageSize=${pageSize}`,
    fetcher,
    {
      refreshInterval: 60000,
    },
  )

  if (error) return <div>Error loading transactions</div>

  return (
    <>
      <Head>
        <title>{`Transaction History - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="w-full">
        <PaginationWrapper totalItems={data?.total || 0} pageSize={pageSize}>
          <TransactionList transactions={data?.data || []} />
        </PaginationWrapper>
      </div>
    </>
  )
}

export default TransactionHistory

TransactionHistory.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout title="Transaction History" containerClass="">
      {page}
    </Layout>
  )
}

export const getServerSideProps = withUserSSR(async ({ query }: any) => {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  return {
    props: {
      pageSize,
      page,
    },
  }
})

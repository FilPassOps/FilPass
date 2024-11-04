import { Layout } from 'components/Layout'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { getUserTransactionCreditsByUserId } from 'domain/transfer-credits/get-user-transaction-credits-by-user-id'
import { AppConfig } from 'config/system'
import { ReactElement } from 'react'
import { TransactionList } from 'components/User/TransactionList'
import { Transaction } from 'domain/transfer-credits/get-user-transaction-credits-by-user-id'
import { getItemsPerPage, PaginationWrapper } from 'components/Shared/PaginationWrapper'

interface TransactionHistoryData {
  transactions: Transaction[]
}

interface TransactionHistoryProps {
  data: TransactionHistoryData
  totalItems: number
  pageSize: number
}

const TransactionHistory = ({ data, totalItems, pageSize }: TransactionHistoryProps) => {
  if (!data) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Head>
        <title>{`Transaction History - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="w-full">
        <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
          <TransactionList transactions={data.transactions} />
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

export const getServerSideProps = withUserSSR(async ({ user, query }: any) => {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  const { data, total } = await getUserTransactionCreditsByUserId({ userId: user.id, currentPage: page, pageSize })

  const transactions = data?.length ? JSON.parse(JSON.stringify(data)) : []

  return {
    props: {
      data: {
        transactions,
      },
      totalItems: total,
      pageSize,
    },
  }
})

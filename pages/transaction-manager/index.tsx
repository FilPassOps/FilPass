import { Layout } from 'components/Layout'
import { withSuperAdminSSR } from 'lib/ssr'
import Head from 'next/head'
import { AppConfig } from 'config/system'
import { ReactElement } from 'react'
import { getAllSubmitTicketTransactions, SubmitTicketTransaction } from 'domain/transfer-credits/get-all-submit-ticket-transactions'
import { getItemsPerPage, PaginationWrapper } from 'components/Shared/PaginationWrapper'
import { TransactionList } from 'components/SuperAdmin/TransactionList'

interface TransactionData {
  transactions: SubmitTicketTransaction[]
  pageSize: number
  page: number
}

interface TransactionsProps {
  data: TransactionData
  totalItems: number
  pageSize: number
}

const Transactions = ({ data, totalItems, pageSize }: TransactionsProps) => {
  if (!data) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Head>
        <title>{`Transaction - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="w-full">
        <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
          <TransactionList transactions={data.transactions} />
        </PaginationWrapper>
      </div>
    </>
  )
}

export default Transactions

Transactions.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout title="Transactions" containerClass="">
      {page}
    </Layout>
  )
}

export const getServerSideProps = withSuperAdminSSR(async ({ query }: any) => {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  const { data } = await getAllSubmitTicketTransactions({ pageSize, page })

  const transactions = data?.transactions?.length ? JSON.parse(JSON.stringify(data.transactions)) : []

  return {
    props: {
      data: {
        transactions: transactions,
      },
      totalItems: data.total,
      page,
      pageSize,
    },
  }
})

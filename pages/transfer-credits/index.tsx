import { Layout } from 'components/Layout'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { LinkButton } from 'components/Shared/Button'
import { ReactElement } from 'react'
import { AppConfig } from 'config/system'
import { getUserCredits } from 'domain/transfer-credits/get-user-credits'
import { getItemsPerPage, PaginationWrapper } from 'components/Shared/PaginationWrapper'
import { TransferCreditList } from 'components/User/TransferCreditList'

export interface UserCreditItem {
  id: number
  height: string
  updatedAt: Date
  submitTicketExpiresAt: Date
  isSubmitTicketExpired: boolean
  refundStartsAt: Date
  isRefundStarted: boolean
  totalHeight: string
  totalSubmitTicket: string
  totalRefunds: string
  contract: {
    address: string
  }
  creditTransactions: {
    id: number
    receiver: {
      walletAddress: string
    }
  }[]
}

interface TransferCreditsProps {
  data: {
    userCreditItems: UserCreditItem[]
  }
  totalItems: number
  pageSize: number
}

const TransferCredits = ({ data, totalItems, pageSize }: TransferCreditsProps) => {
  const { userCreditItems } = data

  return (
    <>
      <Head>
        <title>{`Overview - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-5">
          <div className="flex gap-2 justify-start items-center">
            <div>
              <LinkButton href="/transfer-credits/create-channel" className="flex gap-2">
                <p>Create Channel</p>
              </LinkButton>
            </div>
            <div>
              <LinkButton variant="primary" href="/transfer-credits/transaction-history" className="w-fit h-fit">
                <p>Transaction History</p>
              </LinkButton>
            </div>
          </div>
        </div>
        <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
          <TransferCreditList userCreditItems={userCreditItems} />
        </PaginationWrapper>
      </div>
    </>
  )
}

export default TransferCredits

TransferCredits.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout title="Overview" containerClass="bg-gray-50 h-screen">
      {page}
    </Layout>
  )
}

export const getServerSideProps = withUserSSR(async ({ user, query }: any) => {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  const { data } = await getUserCredits({ userId: user.id, size: pageSize, page })

  const userCreditItems = data?.userCredit ? JSON.parse(JSON.stringify(data.userCredit)) : []

  return {
    props: {
      totalItems: data?.total ?? 0,
      pageSize: pageSize,
      data: {
        userCreditItems,
        total: data?.total ?? 0,
      },
    },
  }
})

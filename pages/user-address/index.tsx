import { UserWalletList } from 'components/AddressManager/UserWalletList'
import { Layout } from 'components/Layout'
import { getItemsPerPage, PaginationWrapper } from 'components/Shared/PaginationWrapper'
import { AppConfig } from 'config'
import { getAllWithWallets } from 'domain/user/get-all-with-wallets'
import { withAddressManagerSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement } from 'react'

interface Wallet {
  user: {
    email: string
  }
  address: string
  id: number
  createdAt: Date
  verificationId: number | null
  blockchain: 'FILECOIN'
  verification: {
    isVerified: boolean
  } | null
}

interface UserAddressProps {
  data: Wallet[]
  pageSize: number
  totalItems: number
}

export default function UserAddress({ data = [], pageSize, totalItems }: UserAddressProps) {
  return (
    <>
      <Head>
        <title>{`User Address - ${AppConfig.app.name}`}</title>
      </Head>
      <PaginationWrapper totalItems={totalItems} pageSize={pageSize} childrenContainerClass="overflow-x-auto overflow-y-hidden">
        <UserWalletList data={data} totalItems={totalItems} />
      </PaginationWrapper>
    </>
  )
}

UserAddress.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="User Address">{page}</Layout>
}
export const getServerSideProps = withAddressManagerSSR(async function getServerSideProps({ user, query }) {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  const { data } = await getAllWithWallets({ size: pageSize, page })

  return {
    props: {
      user,
      data: JSON.parse(JSON.stringify(data?.wallets)),
      totalItems: JSON.parse(JSON.stringify(data?.total)),
      pageSize,
    },
  }
})

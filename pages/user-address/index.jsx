import { UserWalletList } from 'components/AddressManager/UserWalletList'
import { Layout } from 'components/Layout'
import { checkItemsPerPage, PaginationWrapper } from 'components/shared/usePagination'
import { PLATFORM_NAME } from 'system.config'
import { findAllWithWallets } from 'domain/user/findAllWithWallets'
import { withAddressManagerSSR } from 'lib/ssr'
import Head from 'next/head'

export default function UserAddress({ data = [], pageSize, totalItems }) {
  return (
    <>
      <Head>
        <title>User Address - {PLATFORM_NAME}</title>
      </Head>
      <PaginationWrapper totalItems={totalItems} pageSize={pageSize} childrenContainerClass="overflow-x-auto overflow-y-hidden">
        <UserWalletList data={data} totalItems={totalItems} />
      </PaginationWrapper>
    </>
  )
}

UserAddress.getLayout = function getLayout(page) {
  return <Layout title="User Address">{page}</Layout>
}

export const getServerSideProps = withAddressManagerSSR(async ({ user, query }) => {
  const pageSize = checkItemsPerPage(query.itemsPerPage) ? parseInt(query.itemsPerPage) : 100
  const page = parseInt(query.page) || 1
  const {
    data: { wallets, total },
  } = await findAllWithWallets({ size: pageSize, page })

  return {
    props: {
      user,
      data: JSON.parse(JSON.stringify(wallets)),
      totalItems: JSON.parse(JSON.stringify(total)),
      pageSize,
    },
  }
})

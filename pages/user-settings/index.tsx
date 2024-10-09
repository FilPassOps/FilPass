import { Layout } from 'components/Layout'
import { getItemsPerPage, PaginationWrapper } from 'components/Shared/PaginationWrapper'
import { UserList } from 'components/SuperAdmin/UserList'
import { AppConfig } from 'config'
import { getAllUsers } from 'domain/user/get-all'
import { withSuperAdminSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement } from 'react'

interface UserSettingsProps {
  data: any[]
  pageSize: number
  totalItems: number
}

export default function UserSettings({ data = [], pageSize, totalItems }: UserSettingsProps) {
  return (
    <>
      <Head>
        <title>{`User Settings - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="flex justify-between items-center pb-3">
        <p className="text-base font-bold text-gray-900">All users</p>
      </div>
      <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
        <UserList data={data} />
      </PaginationWrapper>
    </>
  )
}

UserSettings.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="User Settings">{page}</Layout>
}

export const getServerSideProps = withSuperAdminSSR(async function getServerSideProps({ query, user }) {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  const { data } = await getAllUsers({
    sort: query?.sort as string | undefined,
    order: query?.order as string | undefined,
    size: pageSize,
    page,
  })
  return {
    props: {
      user,
      data: JSON.parse(JSON.stringify(data?.users)),
      totalItems: JSON.parse(JSON.stringify(data?.totalItems)),
      pageSize,
    },
  }
})

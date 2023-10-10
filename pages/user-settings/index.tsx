import { PlusCircleIcon } from '@heroicons/react/24/solid'
import { Layout } from 'components/Layout'
import { Button } from 'components/shared/Button'
import { getItemsPerPage, PaginationWrapper } from 'components/shared/usePagination'
import { UserList } from 'components/SuperAdmin/UserList'
import { AppConfig } from 'config'
import { findAllUsers } from 'domain/user/findAll'
import { withSuperAdminSSR } from 'lib/ssr'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { ReactElement, useState } from 'react'

const InviteUserModal = dynamic(() => import('components/SuperAdmin/Modals/InviteUserModal').then(mod => mod.InviteUserModal))

interface UserSettingsProps {
  data: any[]
  pageSize: number
  totalItems: number
}

export default function UserSettings({ data = [], pageSize, totalItems }: UserSettingsProps) {
  const [openInviteModal, setOpenInviteModal] = useState(false)

  return (
    <>
      <Head>
        <title>{`User Settings - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="flex justify-between items-center pb-3">
        <p className="text-base font-bold text-gray-900">All users</p>
        <div>
          <Button
            variant="primary"
            className="flex justify-center items-center space-x-2 text-white text-sm font-medium"
            onClick={() => setOpenInviteModal(true)}
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Add New User
          </Button>
        </div>
      </div>
      <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
        <UserList data={data} />
      </PaginationWrapper>
      {openInviteModal && <InviteUserModal open={openInviteModal} onModalClosed={() => setOpenInviteModal(false)} />}
    </>
  )
}

UserSettings.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="User Settings">{page}</Layout>
}

export const getServerSideProps = withSuperAdminSSR(async function getServerSideProps({ query, user }) {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  const { data } = await findAllUsers({
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

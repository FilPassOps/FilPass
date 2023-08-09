import { PlusCircleIcon } from '@heroicons/react/24/solid'
import { Layout } from 'components/Layout'
import { Button } from 'components/shared/Button'
import { checkItemsPerPage, PaginationWrapper } from 'components/shared/usePagination'
import { InviteUserModal } from 'components/SuperAdmin/Modals/InviteUserModal'
import { UserList } from 'components/SuperAdmin/UserList'
import { PLATFORM_NAME } from 'system.config'
import { findAllUsers } from 'domain/user/findAll'
import { withSuperAdminSSR } from 'lib/ssr'
import Head from 'next/head'
import { useState } from 'react'

export default function UserSettings({ data = [], pageSize, totalItems }) {
  const [openInviteModal, setOpenInviteModal] = useState(false)

  return (
    <>
      <Head>
        <title>User Settings - {PLATFORM_NAME}</title>
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
      <InviteUserModal open={openInviteModal} onModalClosed={() => setOpenInviteModal(false)} />
    </>
  )
}

UserSettings.getLayout = function getLayout(page) {
  return <Layout title="User Settings">{page}</Layout>
}

export const getServerSideProps = withSuperAdminSSR(async ({ user, query }) => {
  const pageSize = checkItemsPerPage(query.itemsPerPage) ? parseInt(query.itemsPerPage) : 100
  const page = parseInt(query.page) || 1
  const {
    data: { users, totalItems },
  } = await findAllUsers({
    sort: query?.sort,
    order: query?.order,
    size: pageSize,
    page,
  })
  return {
    props: {
      user,
      data: JSON.parse(JSON.stringify(users)),
      totalItems: JSON.parse(JSON.stringify(totalItems)),
      pageSize,
    },
  }
})

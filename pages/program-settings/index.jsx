import { PlusCircleIcon } from '@heroicons/react/24/solid'
import { Layout } from 'components/Layout'
import { Button } from 'components/shared/Button'
import { checkItemsPerPage, PaginationWrapper } from 'components/shared/usePagination'
import { ProgramList } from 'components/SuperAdmin/ProgramList'
import { PLATFORM_NAME } from 'system.config'
import { ACTIVE_STATUS, ARCHIVED_STATUS } from 'domain/programs/constants'
import { findAllProgramsComplete } from 'domain/programs/findAll'
import { findAllApprovers } from 'domain/user/findAllApprovers'
import { findAllViewers } from 'domain/user/findAllViewers'
import { withSuperAdminSSR } from 'lib/ssr'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'

export default function ProgramSettings({ data = [], approversData = [], viewersData = [], pageSize, total, status }) {
  const [openCreateOrEditModal, setOpenCreateOrEditModal] = useState(false)
  const [currentProgram, setCurrentProgram] = useState()
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Program Settings - {PLATFORM_NAME}</title>
      </Head>
      <div className="w-full">
        <Button
          className="w-56 my-4 ml-auto"
          onClick={() => {
            setCurrentProgram()
            setOpenCreateOrEditModal(true)
          }}
        >
          <div className="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap">
            <PlusCircleIcon className="h-5 w-5" />
            <span>Create New Program</span>
          </div>
        </Button>
        <PaginationWrapper totalItems={total} pageSize={pageSize}>
          <ProgramList
            data={data}
            approversData={approversData}
            viewersData={viewersData}
            refreshPrograms={() => router.replace(router.asPath)}
            openCreateOrEditModal={openCreateOrEditModal}
            setOpenCreateOrEditModal={setOpenCreateOrEditModal}
            currentProgram={currentProgram}
            setCurrentProgram={setCurrentProgram}
            status={status}
          />
        </PaginationWrapper>
      </div>
    </>
  )
}

ProgramSettings.getLayout = function getLayout(page) {
  return <Layout title="Program Settings">{page}</Layout>
}

export const getServerSideProps = withSuperAdminSSR(async ({ user, query }) => {
  const pageSize = checkItemsPerPage(query.itemsPerPage) ? parseInt(query.itemsPerPage) : 100
  const page = parseInt(query.page) || 1
  const status = query.status || ACTIVE_STATUS
  const {
    data: { programs, total },
  } = await findAllProgramsComplete({ archived: status === ARCHIVED_STATUS, page, size: pageSize })
  const { data: approversData } = await findAllApprovers()
  const { data: viewersData } = await findAllViewers()

  return {
    props: {
      user,
      data: JSON.parse(JSON.stringify(programs)),
      approversData: JSON.parse(JSON.stringify(approversData)),
      viewersData: JSON.parse(JSON.stringify(viewersData)),
      status,
      pageSize,
      total: JSON.parse(JSON.stringify(total)),
    },
  }
})

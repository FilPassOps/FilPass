import { PlusCircleIcon } from '@heroicons/react/24/solid'
import { Layout } from 'components/Layout'
import { Button } from 'components/Shared/Button'
import { getItemsPerPage, PaginationWrapper } from 'components/Shared/PaginationWrapper'
import { ProgramList } from 'components/SuperAdmin/ProgramList'
import { AppConfig } from 'config'
import { ACTIVE_STATUS, ARCHIVED_STATUS } from 'domain/programs/constants'
import { getAllProgramsComplete } from 'domain/programs/get-all'
import { getAllApprovers } from 'domain/user/get-all-approvers'
import { getAllViewers } from 'domain/user/get-all-viewers'
import { withSuperAdminSSR } from 'lib/ssr'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ReactElement, useState } from 'react'

interface ProgramSettingsProps {
  data: any[]
  approversData: any[]
  viewersData: any[]
  pageSize: number
  total: number
  status: string
}

export default function ProgramSettings({
  data = [],
  approversData = [],
  viewersData = [],
  pageSize,
  total,
  status,
}: ProgramSettingsProps) {
  const [openCreateOrEditModal, setOpenCreateOrEditModal] = useState(false)
  const [currentProgram, setCurrentProgram] = useState()
  const router = useRouter()

  return (
    <>
      <Head>
        <title>{`Program Settings - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="w-full">
        <Button
          className="w-56 my-4 ml-auto"
          onClick={() => {
            setCurrentProgram(undefined)
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

ProgramSettings.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="Program Settings">{page}</Layout>
}

export const getServerSideProps = withSuperAdminSSR(async ({ user, query }) => {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1
  const status = query.status || ACTIVE_STATUS
  const { data } = await getAllProgramsComplete({ archived: status === ARCHIVED_STATUS, page, size: pageSize })
  const { data: approversData } = await getAllApprovers()
  const { data: viewersData } = await getAllViewers()

  return {
    props: {
      user,
      data: JSON.parse(JSON.stringify(data?.programs)),
      approversData: JSON.parse(JSON.stringify(approversData)),
      viewersData: JSON.parse(JSON.stringify(viewersData)),
      status,
      pageSize,
      total: JSON.parse(JSON.stringify(data?.total)),
    },
  }
})

import { ArrowDownTrayIcon, DocumentDuplicateIcon, DocumentPlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import TransferList from 'components/Approver/TransferList'
import { Filters } from 'components/Filters/Filters'
import { Layout } from 'components/Layout'
import { Button, LinkButton } from 'components/Shared/Button'
import { PaginationCounter } from 'components/Shared/PaginationCounter'
import { PaginationWrapper, getItemsPerPage } from 'components/Shared/PaginationWrapper'
import { AppConfig, ChainNames } from 'config'
import { stringify } from 'csv-stringify/sync'
import { getApprovalsByRole } from 'domain/approvals/service'
import { APPROVER_ROLE, VIEWER_ROLE } from 'domain/auth/constants'
import { SUBMITTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from 'domain/transfer-request/constants'
import JsFileDownload from 'js-file-download'
import { api } from 'lib/api'
import { withRolesSSR } from 'lib/ssr'
import { DateTime } from 'luxon'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import errorsMessages from 'wordings-and-errors/errors-messages'

import dynamic from 'next/dynamic'

const ApproveModal = dynamic(() => import('components/Approver/Modals/ApproveModal').then(mod => mod.ApproveModal))
const RejectModal = dynamic(() => import('components/Approver/Modals/RejectModal').then(mod => mod.RejectModal))
const DeleteModal = dynamic(() => import('components/TransferRequest/Shared/DeleteModal').then(mod => mod.DeleteModal))
const CreateReportModal = dynamic(() => import('components/TransferRequest/Shared/CreateReportModal').then(mod => mod.CreateReportModal))

interface ApprovalsProps {
  initialData: any[]
  totalItems: number
  programs: any[]
  pageSize: number
  page: number
  shouldShowHeaderCheckbox: boolean
  currentStatus: string
  isViewer: boolean
  isApprover: boolean
}

interface Transfer {
  id: number
  program_name: string
  team: string
  wallet_address: string
  amount: number
  request_unit: string
  transfer_amount: number
  transfer_amount_currency_unit: string
  create_date: string
  status: string
  transfer_hash: string
  wallet_blockchain: string
}

interface Request {
  id: string
  amount: number
  request_unit: string
  payment_unit: string
  status: string
  transfer_amount: number
  transfer_amount_currency_unit: string
  transfer_hash: string
  wallet_address: string
  selected: boolean
}

export default function Approvals({
  initialData = [],
  totalItems,
  programs,
  pageSize,
  page,
  shouldShowHeaderCheckbox,
  currentStatus,
  isViewer,
  isApprover,
}: ApprovalsProps) {
  const router = useRouter()

  const [requestList, setRequestList] = useState<Request[]>([])
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [createReportModal, setCreateReportModal] = useState(false)
  const [data, setData] = useState(initialData)

  const handleHeaderCheckboxToggle = (e: any) => {
    const nextSelectAll = e.target.checked
    setRequestList(requestList.map(request => ({ ...request, selected: !!nextSelectAll })))
  }

  const handleRequestChecked = (requestIndex: number) => {
    requestList[requestIndex].selected = !requestList[requestIndex].selected
    setRequestList([...requestList])
  }

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  useEffect(() => {
    const initialRequestList = data.map(request => ({ ...request, selected: false }))
    setRequestList(initialRequestList)
  }, [data])

  const selectedRequests = requestList.filter(request => request.selected)
  const hasOnlySubmitted = selectedRequests.length > 0 && selectedRequests.every(request => request.status === SUBMITTED_STATUS)
  const hasOnlySubmittedByApprover =
    selectedRequests.length > 0 && selectedRequests.every(request => request.status === SUBMITTED_BY_APPROVER_STATUS)

  const handleDownloadCSV = async (values: { pageSelected: string; columns: any }) => {
    const { pageSelected, columns } = values
    try {
      const {
        data: { transfers },
      } = (await api.get(`/approvals`, {
        params: {
          ...router.query,
          status: currentStatus,
          size: pageSelected === 'SINGLE_PAGE' ? pageSize : totalItems,
          page: pageSelected === 'SINGLE_PAGE' ? page : 1,
        },
      })) as { data: { transfers: Transfer[] } }

      const headerFile = []
      columns.number && headerFile.push('No')
      columns.program && headerFile.push('Program')
      columns.name && headerFile.push('Name')
      columns.createDate && headerFile.push('Create Date')
      columns.address && headerFile.push('Address')
      columns.amount && headerFile.push('Request Amount')
      columns.amount && headerFile.push('Request Amount Currency Unit')
      columns.paidAmount && headerFile.push('Paid Amount')
      columns.paidAmount && headerFile.push('Paid Amount Currency Unit')
      columns.status && headerFile.push('Status')
      columns.taxForm && headerFile.push('Tax Form')
      columns.blockExplorerLink && headerFile.push('Block Explorer Link')

      const csvTemplate = stringify(
        [
          headerFile,
          ...transfers.map(
            ({
              id,
              program_name,
              team,
              wallet_address,
              amount,
              request_unit,
              transfer_amount,
              transfer_amount_currency_unit,
              create_date,
              status,
              transfer_hash,
              wallet_blockchain,
            }) => {
              const chain = AppConfig.network.getChainByName(wallet_blockchain as ChainNames)
              const row = []
              columns.number && row.push(id)
              columns.program && row.push(program_name)
              columns.name && row.push(team)
              columns.createDate && row.push(create_date)
              columns.address && row.push(wallet_address)
              columns.amount && row.push(amount)
              columns.amount && row.push(request_unit)
              columns.paidAmount && row.push(transfer_amount)
              columns.paidAmount && row.push(transfer_amount_currency_unit)
              columns.status && row.push(status)
              columns.blockExplorerLink && row.push(`${chain.blockExplorer.url}/${transfer_hash}`)
              return row
            },
          ),
        ],
        {
          delimiter: ',',
        },
      )
      const blob = new Blob([csvTemplate])
      return JsFileDownload(
        blob,
        `${AppConfig.app.name.toLowerCase()}_${currentStatus.toLowerCase()}_approvals_${DateTime.now().toFormat(
          "yyyy-MM-dd_hh'h'mm'm'ss's'",
        )}.csv`,
      )
    } catch (error) {
      console.error(error)
      alert(errorsMessages.something_went_wrong.message)
    } finally {
      setCreateReportModal(false)
    }
  }

  return (
    <>
      <Head>
        <title>{`My Approvals - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="w-full">
        <div>
          {selectedRequests.length > 0 && (
            <>
              <div className="flex mb-4 space-x-3">
                <div>
                  <Button variant="green" onClick={() => setApproveModalOpen(true)} className="mr-4">
                    Approve
                  </Button>
                </div>
                <div>
                  <Button
                    variant="red"
                    onClick={() => setRejectModalOpen(true)}
                    disabled={!hasOnlySubmitted}
                    toolTipText={!hasOnlySubmitted ? 'At least one of the requests you selected cannot be rejected' : ''}
                  >
                    Reject
                  </Button>
                </div>
                <div>
                  <Button
                    variant="opacity-red"
                    onClick={() => setDeleteModalOpen(true)}
                    disabled={!hasOnlySubmittedByApprover}
                    toolTipText={!hasOnlySubmittedByApprover ? 'At least one of the requests you selected cannot be deleted.' : ''}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <PaginationCounter total={selectedRequests.length} status={currentStatus} />
            </>
          )}
        </div>
        <div className="w-full">
          <div className="flex items-center justify-end md:justify-between gap-2 py-4">
            <div className="hidden md:flex">{isApprover && <BatchActionsButton />}</div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreateReportModal(true)} variant="outline">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <ArrowDownTrayIcon className="h-5" />
                  Create Report
                </div>
              </Button>
              <Filters programs={programs} />
            </div>
          </div>
          <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
            <TransferList
              data={requestList}
              onRequestChecked={handleRequestChecked}
              onHeaderToggle={handleHeaderCheckboxToggle}
              shouldShowHeaderCheckbox={shouldShowHeaderCheckbox}
            />
          </PaginationWrapper>
        </div>
      </div>

      {approveModalOpen && (
        <ApproveModal open={approveModalOpen} data={selectedRequests} onModalClosed={() => setApproveModalOpen(false)} isBatch />
      )}
      {rejectModalOpen && (
        <RejectModal open={rejectModalOpen} data={selectedRequests} onModalClosed={() => setRejectModalOpen(false)} isBatch />
      )}

      {createReportModal && (
        <CreateReportModal
          open={createReportModal}
          onModalClosed={() => setCreateReportModal(false)}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          showPaidStatusColumns={isViewer}
          handleDownloadCSV={handleDownloadCSV}
        />
      )}

      {deleteModalOpen && (
        <DeleteModal
          onModalClosed={() => setDeleteModalOpen(false)}
          open={deleteModalOpen}
          data={selectedRequests}
          redirectTo="/approvals"
        />
      )}
    </>
  )
}

export const BatchActionsButton = () => {
  const [toggle, setToggle] = useState(false)
  return (
    <div className="md:relative text-white whitespace-nowrap">
      <Button onClick={() => setToggle(prev => !prev)}>
        <div className="flex gap-2">
          <DocumentDuplicateIcon className="h-5 w-5 hidden md:block" />
          Batch Actions
        </div>
      </Button>
      <div
        className={`${
          toggle ? 'absolute' : 'hidden'
        } z-30 left-0 md:left-auto w-screen md:w-64 h-screen md:h-auto flex flex-col gap-2 mt-4 md:mt-2 py-4 bg-indigo-700 rounded-md md:shadow-lg`}
      >
        <div className="absolute top-0 right-0">
          <Button variant="none" onClick={() => setToggle(false)}>
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>
        <LinkButton variant="none" href="/csv-transfer-requests">
          <div className="w-full flex items-center gap-2 hover:font-extrabold">
            <DocumentDuplicateIcon className="h-6 w-6" />
            Upload CSV
          </div>
        </LinkButton>
        <LinkButton variant="none" href="/transfer-requests/create?batch=true">
          <div className="w-full flex items-center gap-2 hover:font-extrabold">
            <DocumentPlusIcon className="h-6 w-6" />
            Create Transfer Requests
          </div>
        </LinkButton>
      </div>
    </div>
  )
}

Approvals.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="My Approvals">{page}</Layout>
}

export const getServerSideProps = withRolesSSR([APPROVER_ROLE, VIEWER_ROLE], async ({ user: { id, roles }, query }) => {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1
  const programId = query.programId || null
  const requestNumber = query.number
  const team = query.team?.toString().split(',')
  const networks = query.network?.length ? (query.network as string).split(',') : []

  const isViewer = roles.some(({ role }) => role === VIEWER_ROLE)
  const isApprover = roles.some(({ role }) => role === APPROVER_ROLE)

  const status = query.status

  let fromDate, toDate

  if (query.from && query.to) {
    fromDate = new Date(parseInt(query.from.toString()))
    fromDate.setHours(0, 0, 0, 0)
    toDate = new Date(parseInt(query.to.toString()))
    toDate.setHours(23, 59, 59, 999)
  }

  const wallet = query.wallet as string | undefined

  const addresses = [wallet]

  const filteredAddresses = addresses.filter((wallet): wallet is string => !!wallet)

  const { transfers, totalItems, error, shouldShowHeaderCheckbox, currentStatus, programs } = await getApprovalsByRole({
    roles,
    userId: id,
    status: status as string | undefined,
    programId: programId as string | undefined,
    requestNumber: requestNumber as string | undefined,
    networks,
    team,
    from: fromDate,
    to: toDate,
    wallets: filteredAddresses,
    size: pageSize,
    sort: query?.sort as 'number' | 'program' | 'create_date',
    order: query?.order as 'asc' | 'desc',
    page,
  })

  if (error && error.status !== 400) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      totalItems: totalItems || 0,
      initialData: JSON.parse(JSON.stringify(transfers)),
      programs: JSON.parse(JSON.stringify(programs)),
      page,
      pageSize,
      shouldShowHeaderCheckbox,
      currentStatus,
      isViewer,
      isApprover,
    },
  }
})

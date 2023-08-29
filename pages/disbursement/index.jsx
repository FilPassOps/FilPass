import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import config from 'chains.config'
import MetamaskPayment from 'components/Controller/MetaMaskPayment'
import NotifyCorfimationModal from 'components/Controller/Modals/NotifyConfirmationModal'
import RejectModal from 'components/Controller/Modals/RejectModal'
import TransferList from 'components/Controller/TransferList'
import { Filters } from 'components/Filters/Filters'
import { Layout } from 'components/Layout'
import { Button } from 'components/shared/Button'
import { PaginationCounter } from 'components/shared/PaginationCounter'
import { checkItemsPerPage, PaginationWrapper } from 'components/shared/usePagination'
import { CreateReportModal } from 'components/TransferRequest/shared/CreateReportModal'
import { PLATFORM_NAME } from 'system.config'
import { stringify } from 'csv-stringify/sync'
import { getAll } from 'domain/disbursement/getAll'
import { findAllPrograms } from 'domain/programs/findAll'
import { APPROVED_STATUS, PAID_STATUS } from 'domain/transferRequest/constants'
import JsFileDownload from 'js-file-download'
import { api } from 'lib/api'
import { getDelegatedAddress } from 'lib/getDelegatedAddress'
import { withControllerSSR } from 'lib/ssr'
import { DateTime } from 'luxon'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { WithMetaMaskButton } from 'components/web3/MetaMaskProvider'
import Head from 'next/head'

export default function Disbursement({ initialData = [], programs = [], pageSize, totalItems, page, status }) {
  const router = useRouter()
  const sort = router?.query?.sort || 'createdAt'
  const order = router?.query?.order || 'asc'
  const isPayment = router.asPath.split('#')[1] === 'payment'

  const [requestList, setRequestList] = useState([])
  const [paymentModalTransactions, setPaymentModalTransactions] = useState([])
  const [rejectModalTransactions, setRejectModalTransactions] = useState([])
  const [openRejectModal, setOpenRejectModal] = useState(false)
  const [openNotifyModal, setOpenNotifyModal] = useState(false)
  const [createReportModal, setCreateReportModal] = useState(false)
  const [data, setData] = useState(initialData)

  const handleRequestChecked = requestIndex => {
    requestList[requestIndex].selected = !requestList[requestIndex].selected
    setRequestList([...requestList])
  }

  useEffect(() => {
    if (!data) {
      return
    }
    const initialRequestList = data.map(request => ({ ...request, selected: false }))
    setRequestList(initialRequestList)
  }, [data])

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const handleHeaderCheckboxToggle = e => {
    const nextSelectAll = e.target.checked
    setRequestList(requestList.map(request => ({ ...request, selected: !!nextSelectAll })))
  }

  const unselectAll = () => {
    setRequestList(requestList.map(request => ({ ...request, selected: false })))
  }

  const onSinglePayClick = data => {
    setPaymentModalTransactions([data])
    router.push('#payment')
  }

  const onMetamaskBatchPayClick = () => {
    setPaymentModalTransactions(requestList.filter(request => request.selected))
    router.push('#payment')
  }

  const onSingleRejectClick = data => {
    setRejectModalTransactions([data.publicId])
    setOpenRejectModal(true)
  }

  const onBatchRejectClick = () => {
    setRejectModalTransactions(requestList.filter(request => request.selected).map(({ publicId }) => publicId))
    setOpenRejectModal(true)
  }

  const handleNotifyClick = () => {
    setPaymentModalTransactions(requestList.filter(request => request.selected))
    setOpenNotifyModal(true)
  }

  const handleDownloadCSV = async values => {
    const { pageSelected, columns } = values
    try {
      const { data } = await api.get(`/disbursement`, {
        params: {
          ...router.query,
          status,
          size: pageSelected === 'SINGLE_PAGE' ? pageSize : totalItems,
          page: pageSelected === 'SINGLE_PAGE' ? page : 1,
          sort,
          order,
        },
      })

      const headerFile = []
      columns.number && headerFile.push('No')
      columns.receiverEmail && headerFile.push('Receiver Email')
      columns.program && headerFile.push('Program')
      columns.name && headerFile.push('Name')
      columns.createDate && headerFile.push(status === PAID_STATUS ? 'Paid Date' : 'Create Date')
      columns.address && headerFile.push('Address')
      columns.address && headerFile.push('Filecoin Equivalent Address')
      columns.amount && headerFile.push('Request Amount')
      columns.amount && headerFile.push('Request Amount Currency Unit')
      columns.paidFilAmount && headerFile.push('Paid Amount')
      columns.paidFilAmount && headerFile.push('Paid Amount Currency Unit')
      columns.status && headerFile.push('Status')
      columns.residency && headerFile.push('Residency')
      columns.taxForm && headerFile.push('Tax Form')
      columns.filfoxLink && headerFile.push('Filfox link')

      const csvTemplate = stringify(
        [
          headerFile,
          ...data.requests.map(({ program, wallet, transfers, currency, receiver, form, ...request }) => {
            const row = []
            columns.number && row.push(request.publicId)
            columns.receiverEmail && row.push(receiver.email)
            columns.program && row.push(program.name)
            columns.name && row.push(request.team)
            columns.createDate && row.push(status === PAID_STATUS ? request.updatedAt : request.createdAt)
            columns.address && row.push(wallet.address)
            columns.address && row.push(request.delegated_address || getDelegatedAddress(wallet.address)?.fullAddress)
            columns.amount && row.push(request.amount)
            columns.amount && row.push(currency.name)
            columns.paidFilAmount && row.push(transfers[0].amount)
            columns.paidFilAmount && row.push(transfers[0].amountCurrencyUnit?.name ?? 'FIL')
            columns.status && row.push(status)
            columns.residency && row.push(request.isUSResident ? 'US' : 'Non-US')
            columns.taxForm && !!form && row.push(`${window?.location.origin}/api/files/${form.publicId}/view`)
            columns.filfoxLink && row.push(`${config.chain.blockExplorerUrls[0]}/message/${transfers[0].txHash}`)
            return row
          }),
        ],
        {
          delimiter: ',',
        },
      )
      const blob = new Blob([csvTemplate])
      return JsFileDownload(
        blob,
        `${PLATFORM_NAME.toLowerCase()}_${status.toLowerCase()}_disbursement_${DateTime.now().toFormat("yyyy-MM-dd_hh'h'mm'm'ss's'")}.csv`,
      )
    } catch (error) {
      console.error(error)
      alert(errorsMessages.something_went_wrong.message)
    } finally {
      setCreateReportModal(false)
    }
  }

  const selectedRequests = requestList.filter(request => request.selected)

  const isNotPaidStatus = status !== PAID_STATUS

  return (
    <>
      <Head>
        <title>{`Disbursement - ${PLATFORM_NAME}`}</title>
      </Head>
      {isPayment && paymentModalTransactions.length ? (
        <MetamaskPayment data={paymentModalTransactions} />
      ) : (
        <>
          <RejectModal open={openRejectModal} onModalClosed={() => setOpenRejectModal(false)} data={rejectModalTransactions} />

          <NotifyCorfimationModal open={openNotifyModal} onClose={() => setOpenNotifyModal(false)} data={paymentModalTransactions} />

          {createReportModal && (
            <CreateReportModal
              open={createReportModal}
              onModalClosed={() => setCreateReportModal(false)}
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              status={status}
              handleDownloadCSV={handleDownloadCSV}
              showPaidStatusColumns={status === PAID_STATUS}
              isDisbursement
            />
          )}

          <div className="flex items-center gap-2">
            {selectedRequests.length > 0 && status === PAID_STATUS && (
              <>
                <div>
                  <Button variant="primary" onClick={handleNotifyClick} className="mr-4">
                    Notify Receiver
                  </Button>
                </div>
                <div>
                  <Button variant="red" onClick={unselectAll}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
            {selectedRequests.length > 0 && isNotPaidStatus && (
              <div className="flex items-center gap-4">
                <div>
                  <WithMetaMaskButton variant="green" onClick={onMetamaskBatchPayClick} defaultLabel="Pay">
                    Pay
                  </WithMetaMaskButton>
                </div>
                <div>
                  <Button variant="red" onClick={onBatchRejectClick}>
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
          <PaginationCounter total={selectedRequests.length} status={status} />
          <div>
            <div className="flex items-center justify-end py-4">
              <div className="flex items-center gap-2">
                <Button onClick={() => setCreateReportModal(true)} variant="outline">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <ArrowDownTrayIcon className="h-5" />
                    Create Report
                  </div>
                </Button>
                <Filters programs={programs} dateFilterLabel={status === PAID_STATUS ? 'Paid Date' : 'Create Date'} />
              </div>
            </div>
            <PaginationWrapper totalItems={totalItems} pageSize={pageSize}>
              <TransferList
                requests={requestList}
                onRequestChecked={handleRequestChecked}
                onHeaderToggle={handleHeaderCheckboxToggle}
                onSinglePayClick={onSinglePayClick}
                onSingleRejectClick={onSingleRejectClick}
                shouldShowHeaderCheckbox={status === APPROVED_STATUS}
                notifyCheckbox={status === PAID_STATUS}
              />
            </PaginationWrapper>
          </div>
        </>
      )}
    </>
  )
}

Disbursement.getLayout = function getLayout(page) {
  return <Layout title="Disbursement">{page}</Layout>
}

export const getServerSideProps = withControllerSSR(async ({ query }) => {
  const pageSize = checkItemsPerPage(query.itemsPerPage) ? parseInt(query.itemsPerPage) : 100
  const page = parseInt(query.page) || 1
  const status = query.status || APPROVED_STATUS
  const programId = query.programId?.length ? query.programId.split(',') : []
  const requestNumber = query.number
  const wallet = query.wallet
  const team = query.team?.toString().split(',')

  let fromDate, toDate

  if (query.from && query.to) {
    fromDate = new Date(parseInt(query.from.toString()))
    fromDate.setHours(0, 0, 0, 0)
    toDate = new Date(parseInt(query.to.toString()))
    toDate.setHours(23, 59, 59, 999)
  }

  const {
    data: { requests, total },
    error,
  } = await getAll({
    status,
    programId,
    requestNumber,
    team,
    from: fromDate,
    to: toDate,
    wallet,
    size: pageSize,
    sort: query?.sort,
    order: query?.order,
    page,
  })

  const { data: programs } = await findAllPrograms({ archived: false })

  if (error && error.status !== 400) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      initialData: JSON.parse(JSON.stringify(requests)),
      programs: JSON.parse(JSON.stringify(programs)),
      totalItems: total || 0,
      pageSize,
      page,
      status,
    },
  }
})

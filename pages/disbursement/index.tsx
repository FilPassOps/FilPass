import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Blockchain, TransferStatus } from '@prisma/client'
import MetamaskPayment from 'components/Controller/MetaMaskPayment'
import NotifyCorfimationModal from 'components/Controller/Modals/NotifyConfirmationModal'
import RejectModal from 'components/Controller/Modals/RejectModal'
import TransferList from 'components/Controller/TransferList'
import { Filters } from 'components/Filters/Filters'
import { Layout } from 'components/Layout'
import { useAlertDispatcher } from 'components/Layout/Alerts'
import { CreateReportModal } from 'components/TransferRequest/shared/CreateReportModal'
import { Button } from 'components/shared/Button'
import { PaginationCounter } from 'components/shared/PaginationCounter'
import { PaginationWrapper, getItemsPerPage } from 'components/shared/usePagination'
import { WithMetaMaskButton } from 'components/web3/MetaMaskProvider'
import { AppConfig, ChainNames } from 'config'
import { stringify } from 'csv-stringify/sync'
import { getAll } from 'domain/disbursement/getAll'
import { findAllPrograms } from 'domain/programs/findAll'
import { APPROVED_STATUS, PAID_STATUS } from 'domain/transferRequest/constants'
import JsFileDownload from 'js-file-download'
import { api } from 'lib/api'
import { WalletSize, getDelegatedAddress } from 'lib/getDelegatedAddress'
import { withControllerSSR } from 'lib/ssr'
import { DateTime } from 'luxon'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface DisbursementProps {
  initialData: any[]
  pageSize: number
  totalItems: number
  page: number
  status: string
  programs: any[]
}

interface ProgramCurrency {
  currency: {
    name: string
  }
  type: string
}

interface DisbursementRequest {
  id: number
  status: string
  publicId: string
  team: string
  createdAt: string
  updatedAt: string
  delegated_address: string
  amount: string
  isHexMatch?: boolean
  selected: boolean
  wallet_blockchain: string
  wallet: {
    address: string
    blockchain: Blockchain
    verificationId: string
  }
  program: {
    programCurrency: ProgramCurrency[]
    blockchain: Blockchain
    name: string
  }
  transfers: {
    isActive: boolean
    amount: string
    status: TransferStatus
    amountCurrencyUnit: {
      name: string
    }
    txHash: string
  }[]
  currency: {
    name: string
  }
  receiver: {
    email: string
  }
  amountCurrencyUnit: {
    name: string
  }
}

interface DisbursementResult {
  data: {
    requests: DisbursementRequest[]
  }
}

export default function Disbursement({ initialData = [], programs = [], pageSize, totalItems, page, status }: DisbursementProps) {
  const router = useRouter()
  const sort = router?.query?.sort || 'createdAt'
  const order = router?.query?.order || 'asc'
  const isPayment = router.asPath.split('#')[1] === 'payment'

  const [requestList, setRequestList] = useState<DisbursementRequest[]>([])
  const [paymentModalTransactions, setPaymentModalTransactions] = useState<DisbursementRequest[]>([])
  const [rejectModalTransactions, setRejectModalTransactions] = useState<string[]>([])
  const [openRejectModal, setOpenRejectModal] = useState(false)
  const [openNotifyModal, setOpenNotifyModal] = useState(false)
  const [createReportModal, setCreateReportModal] = useState(false)
  const [data, setData] = useState(initialData)

  const { dispatch } = useAlertDispatcher()

  const selectedRequests = requestList.filter(request => request.selected)
  const isNotPaidStatus = status !== PAID_STATUS

  const handleRequestChecked = (requestIndex: number) => {
    requestList[requestIndex].selected = !requestList[requestIndex].selected
    setRequestList([...requestList])
    localStorage.setItem(
      'disbursement-selected',
      JSON.stringify(requestList.filter(request => request.selected).map(({ publicId }) => publicId)),
    )
  }

  useEffect(() => {
    if (!data) {
      return
    }
    const selected = localStorage.getItem('disbursement-selected')
    const selectedRequests = selected ? JSON.parse(selected) : []

    const initialRequestList = data.map(request => ({ ...request, selected: selectedRequests.includes(request.publicId) }))
    setRequestList(initialRequestList)
  }, [data])

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const handleHeaderCheckboxToggle = (e: any) => {
    const nextSelectAll = e.target.checked
    setRequestList(requestList.map(request => ({ ...request, selected: !!nextSelectAll })))
  }

  const unselectAll = () => {
    setRequestList(requestList.map(request => ({ ...request, selected: false })))
  }

  const onSinglePayClick = (data: DisbursementRequest) => {
    setPaymentModalTransactions([data])
    router.push('#payment')
  }

  const onMetamaskBatchPayClick = () => {
    handlePayment(requestList.filter(request => request.selected))
  }

  const onBeforeMetamaskBatchPayClick = () => {
    const hasDifferentChains = selectedRequests.some(
      request => request.program.blockchain.name !== selectedRequests[0].program.blockchain.name,
    )
    if (hasDifferentChains) {
      dispatch({
        type: 'warning',
        title: 'Transfer requests on multiple chains selected',
        body: () => (
          <p>{`You cannot pay requests on different blockchains at the same time. Select 'Filters' to display only requests of one blockchain.`}</p>
        ),
        config: {
          closeable: true,
        },
      })
      throw new Error('Transfer requests on multiple chains selected')
    }
  }

  const onSingleRejectClick = (data: DisbursementRequest) => {
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

  const handlePayment = (requestListData: DisbursementRequest[]) => {
    localStorage.setItem('disbursement', JSON.stringify(requestListData))
    setPaymentModalTransactions(requestListData)
    router.push('#payment')
  }

  const handleDownloadCSV = async (values: { pageSelected: string; columns: any }) => {
    const { pageSelected, columns } = values
    try {
      const { data } = (await api.get(`/disbursement`, {
        params: {
          ...router.query,
          status,
          size: pageSelected === 'SINGLE_PAGE' ? pageSize : totalItems,
          page: pageSelected === 'SINGLE_PAGE' ? page : 1,
          sort,
          order,
        },
      })) as DisbursementResult

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
      columns.filfoxLink && headerFile.push('Filfox link')

      const csvTemplate = stringify(
        [
          headerFile,
          ...data.requests.map(({ program, wallet, transfers, currency, receiver, wallet_blockchain, ...request }) => {
            const chain = AppConfig.network.getChainByName(wallet_blockchain as ChainNames)

            const row = []
            columns.number && row.push(request.publicId)
            columns.receiverEmail && row.push(receiver.email)
            columns.program && row.push(program.name)
            columns.name && row.push(request.team)
            columns.createDate && row.push(status === PAID_STATUS ? request.updatedAt : request.createdAt)
            columns.address && row.push(wallet.address)
            columns.address &&
              row.push(
                request.delegated_address || getDelegatedAddress(wallet.address, WalletSize.FULL, wallet.blockchain.name)?.fullAddress,
              )
            columns.amount && row.push(request.amount)
            columns.amount && row.push(currency.name)
            columns.paidFilAmount && row.push(transfers[0].amount)
            columns.paidFilAmount && row.push(transfers[0].amountCurrencyUnit?.name ?? 'FIL')
            columns.status && row.push(status)
            columns.filfoxLink && row.push(`${chain.blockExplorer.url}/${transfers[0].txHash}`)
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
        `${AppConfig.app.name.toLowerCase()}_${status.toLowerCase()}_disbursement_${DateTime.now().toFormat(
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
        <title>{`Disbursement - ${AppConfig.app.name}`}</title>
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
                  <WithMetaMaskButton
                    variant="green"
                    onBeforeClick={onBeforeMetamaskBatchPayClick}
                    onClick={onMetamaskBatchPayClick}
                    defaultLabel="Pay"
                    targetChainId={AppConfig.network.getChainByName(selectedRequests[0].program.blockchain.name as ChainNames).chainId}
                    switchChainLabel="Switch network to pay"
                  >
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
                <Filters
                  programs={programs}
                  dateFilterLabel={status === PAID_STATUS ? 'Paid Date' : 'Create Date'}
                  showCountByNetworkForController
                />
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

Disbursement.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="Disbursement">{page}</Layout>
}

export const getServerSideProps = withControllerSSR(async ({ query }) => {
  const pageSize = getItemsPerPage(query.itemsPerPage)
  const page = query.page && typeof query.page === 'string' ? parseInt(query.page) : 1

  const status = query.status || APPROVED_STATUS
  const networks = query.network?.length ? (query.network as string).split(',') : []

  const programId = query.programId?.length ? (query.programId as string).split(',').map(Number) : []
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
  } = (await getAll({
    status: status as string | undefined,
    networks,
    programId,
    requestNumber: requestNumber as string,
    team,
    from: fromDate,
    to: toDate,
    wallet: wallet as string,
    size: pageSize,
    sort: query?.sort as 'number' | 'program' | 'create_date',
    order: query?.order as 'asc' | 'desc',
    page,
  })) as any

  if (error && error.status !== 400) {
    return {
      notFound: true,
    }
  }

  const { data: programs } = await findAllPrograms({ archived: false })

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

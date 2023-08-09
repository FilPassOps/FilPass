import { ApproveTaxFormModal } from 'components/Finance/Modals/ApproveTaxFormModal'
import { RejectTaxFormModal } from 'components/Finance/Modals/RejectTaxFormModal'
import { TaxFormList } from 'components/Finance/TaxFormList'
import { Layout } from 'components/Layout'
import { Button } from 'components/shared/Button'
import { checkItemsPerPage, PaginationWrapper } from 'components/shared/usePagination'
import { PLATFORM_NAME } from 'system.config'
import { findAllTaxForms } from 'domain/files'
import { withFinanceSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement, useEffect, useState } from 'react'

export enum TaxStatus {
  UNREVIEWED = 'UNREVIEWED',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
}

interface TaxReviewPageProps {
  data: {
    id: number
    user: {
      email: string
    }
    publicId?: string
    filename?: string
    rejectionReason?: string
    selected: boolean
  }[]
  totalItems: number
  pageSize: number
  status: TaxStatus
}

export default function TaxReviewPage({ data, totalItems, pageSize, status }: TaxReviewPageProps) {
  const [taxForms, setTaxForms] = useState(data)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)

  const selectedTaxForms = taxForms.filter(item => item.selected)
  const selectedTotalTaxForms = selectedTaxForms.length

  const finalList = selectedTaxForms.map(item => ({ id: item.id, email: item.user.email }))

  useEffect(() => {
    setTaxForms(data)
  }, [data])

  return (
    <>
      <Head>
        <title>Tax Review - {PLATFORM_NAME}</title>
      </Head>
      {selectedTotalTaxForms > 0 && (
        <>
          <div className="flex mb-4 gap-2">
            {status !== TaxStatus.APPROVED && (
              <Button variant="green" onClick={() => setApproveModalOpen(true)} className="w-fit">
                Approve
              </Button>
            )}
            {status !== TaxStatus.REJECTED && (
              <Button variant="red" onClick={() => setRejectModalOpen(true)} className="w-fit">
                Reject
              </Button>
            )}
          </div>
          <p className="w-full bg-platinum p-3 text-black text-center">
            {`Selected ${selectedTotalTaxForms} tax form${selectedTotalTaxForms > 1 ? 's' : ''}`}
          </p>
        </>
      )}
      <PaginationWrapper totalItems={totalItems} pageSize={pageSize} isLoading={false}>
        <TaxFormList taxForms={taxForms} setTaxForms={setTaxForms} status={status} selectedTotalTaxForms={selectedTotalTaxForms} />
      </PaginationWrapper>
      {finalList && <ApproveTaxFormModal open={approveModalOpen} onModalClosed={() => setApproveModalOpen(false)} taxForms={finalList} />}
      {finalList && <RejectTaxFormModal open={rejectModalOpen} onModalClosed={() => setRejectModalOpen(false)} taxForms={finalList} />}
    </>
  )
}

TaxReviewPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="Tax Review">{page}</Layout>
}

export const getServerSideProps = withFinanceSSR(async ({ query }: any) => {
  const status = (query.status || TaxStatus.UNREVIEWED) as TaxStatus
  const page = parseInt(query.page || 1)
  const pageSize = checkItemsPerPage(query.itemsPerPage) ? parseInt(query.itemsPerPage) : 100

  let result

  if (status === TaxStatus.UNREVIEWED) {
    result = await findAllTaxForms({ isApproved: null, page, pageSize })
  } else if (status === TaxStatus.REJECTED) {
    result = await findAllTaxForms({ isApproved: false, page, pageSize })
  } else {
    result = await findAllTaxForms({ isApproved: true, page, pageSize })
  }

  const { data, error } = result

  if (error) {
    throw new Error(error.errors.taxForm.message)
  }

  return {
    props: {
      data: JSON.parse(JSON.stringify(data?.taxForms.map(item => ({ ...item, selected: false })))),
      totalItems: data?.totalItems,
      pageSize,
      status,
    },
  }
})

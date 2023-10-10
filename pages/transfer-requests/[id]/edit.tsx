import { Layout } from 'components/Layout'
import { TransferRequestForm } from 'components/TransferRequest/TransferRequestForm'
import { StatusNotes } from 'components/TransferRequest/ViewTransferRequest/StatusNotes'
import { Divider } from 'components/shared/Divider'
import { GoBackConfirmationWithRouter } from 'components/shared/GoBackConfirmation'
import { StatusBadge } from 'components/shared/Status'
import { AppConfig } from 'config'
import { findAllExternalPrograms } from 'domain/programs/findAll'
import { DRAFT_STATUS } from 'domain/transferRequest/constants'
import { getUserTransferRequestById } from 'domain/transferRequest/getUserTransferRequestById'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement } from 'react'

interface EditTransferRequestProps {
  data: {
    id: number
    isVoidable: boolean
    isEditable: boolean
    applyer_id: number
    status: string
  }
  programs: any[]
}

export default function EditTransferRequest({ data, programs }: EditTransferRequestProps) {
  return (
    <>
      <Head>
        <title>{`Edit Transfer Request #${data?.id} - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center my-6">
          <h1 className="text-gray-700 font-medium">Transfer Request #{data?.id}</h1>

          <div className="space-x-4">
            <span className="text-gray-700 font-medium">Status</span>
            <StatusBadge status={data?.status} />
          </div>
        </div>

        {data?.status === DRAFT_STATUS && (
          <StatusNotes
            changesRequested={[]}
            status={DRAFT_STATUS}
            notes="To submit this transfer request, review the request information and add any missing details."
          />
        )}

        <Divider />
        <TransferRequestForm isEditable programs={programs} data={data} />
      </div>
      <GoBackConfirmationWithRouter />
    </>
  )
}

EditTransferRequest.getLayout = function getLayout(page: ReactElement) {
  const data = page.props.data
  return <Layout title={`Edit Transfer Request #${data?.id}`}>{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ user, query }) => {
  const { data, error: dataError } = await getUserTransferRequestById({
    transferRequestId: query.id as string,
    userId: user.id,
  })

  const { data: programs } = await findAllExternalPrograms()

  if (dataError) {
    return {
      notFound: true,
    }
  }

  if (!data.isEditable) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      user,
      data: JSON.parse(JSON.stringify(data)),
      programs: JSON.parse(JSON.stringify(programs)),
    },
  }
})

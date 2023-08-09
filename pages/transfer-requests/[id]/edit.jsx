import { Layout } from 'components/Layout'
import { Divider } from 'components/shared/Divider'
import { GoBackConfirmationWithRouter } from 'components/shared/GoBackConfirmation'
import { StatusBadge } from 'components/shared/Status'
import { TransferRequestForm } from 'components/TransferRequest/TransferRequestForm'
import { StatusNotes } from 'components/TransferRequest/ViewTransferRequest/StatusNotes'
import { PLATFORM_NAME } from 'system.config'
import { findAllExternalPrograms } from 'domain/programs/findAll'
import { DRAFT_STATUS } from 'domain/transferRequest/constants'
import { getUserTransferRequestById } from 'domain/transferRequest/getUserTransferRequestById'
import { getMasterWallet } from 'lib/filecoin'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'

export default function EditTransferRequest({ data, programs, masterAddress }) {
  return (
    <>
      <Head>
        <title>Edit Transfer Request #{data?.id} - {PLATFORM_NAME}</title>
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
        <TransferRequestForm isEditable programs={programs} data={data} masterAddress={masterAddress} />
      </div>
      <GoBackConfirmationWithRouter />
    </>
  )
}

EditTransferRequest.getLayout = function getLayout(page) {
  const data = page.props.data
  return <Layout title={`Edit Transfer Request #${data?.id}`}>{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ user, query }) => {
  const { isSanctioned, isReviewedByCompliance } = user

  if (isReviewedByCompliance && isSanctioned) {
    return {
      redirect: {
        destination: '/flagged-account',
      },
    }
  }

  const { data, error: dataError } = await getUserTransferRequestById({
    transferRequestId: query.id,
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

  const masterWallet = getMasterWallet()

  return {
    props: {
      user,
      data: JSON.parse(JSON.stringify(data)),
      programs: JSON.parse(JSON.stringify(programs)),
      masterAddress: masterWallet.address,
    },
  }
})

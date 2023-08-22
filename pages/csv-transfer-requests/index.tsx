import { BatchCSV } from 'components/Approver/UploadBatchCSV'
import { Layout } from 'components/Layout'
import { Divider } from 'components/shared/Divider'
import { RequestorReceiver } from 'components/TransferRequest/shared/RequestorReceiver'
import { withApproverSSR } from 'lib/ssr'
import { PageAlert } from '../../components/Layout/Alerts'
import { PLATFORM_NAME } from 'system.config'
import { ReactElement } from 'react'

interface CSVTransferRequestsPageProps {
  approver: {
    email: string
  }
}

export default function CSVTransferRequestsPage({ approver }: CSVTransferRequestsPageProps) {
  return (
    <>
      <div className="my-6">
        <RequestorReceiver applyer={approver?.email} />
        <Divider className="my-8" />
      </div>
      <PageAlert type="warning" withIcon={false} className="mb-8">
        <p>
          {PLATFORM_NAME} won&apos;t ask the receiver(s) to submit their tax form and personal information for sanction purposes. Please
          ensure you have collected the appropriate information regarding tax and sanction checks if you proceed.
        </p>
      </PageAlert>

      <BatchCSV />
    </>
  )
}

CSVTransferRequestsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout title={`Upload CSV to Create Transfer Requests - ${PLATFORM_NAME}`} containerClass="bg-gray-50 min-h-screen">
      {page}
    </Layout>
  )
}

export const getServerSideProps = withApproverSSR(async ({ user }) => {
  return {
    props: { approver: user },
  }
})

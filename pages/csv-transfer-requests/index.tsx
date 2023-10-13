import { BatchCSV } from 'components/Approver/UploadBatchCSV'
import { Layout } from 'components/Layout'
import { RequestorReceiver } from 'components/TransferRequest/Shared/RequestorReceiver'
import { Divider } from 'components/Shared/Divider'
import { AppConfig } from 'config'
import { withApproverSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement } from 'react'

interface CSVTransferRequestsPageProps {
  approver: {
    email: string
  }
}

export default function CSVTransferRequestsPage({ approver }: CSVTransferRequestsPageProps) {
  return (
    <>
      <Head>
        <title>{`Upload CSV - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="my-6">
        <RequestorReceiver applyer={approver?.email} />
        <Divider className="my-8" />
      </div>

      <BatchCSV />
    </>
  )
}

CSVTransferRequestsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout title="Upload CSV to Create Transfer Requests" containerClass="bg-gray-50 min-h-screen">
      {page}
    </Layout>
  )
}

export const getServerSideProps = withApproverSSR(async ({ user }) => {
  return {
    props: { approver: user },
  }
})

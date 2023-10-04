import { TransferRequestView, TransferRequestViewProps } from 'components/Controller/TransferRequestView'
import { Layout } from 'components/Layout'
import { getTransferRequestById } from 'domain/transferRequest/getTransferRequestById'
import { withControllerSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement } from 'react'
import { AppConfig } from 'system.config'

export default function ControllerView({ data }: TransferRequestViewProps) {
  return (
    <>
      <Head>
        <title>{`Disbursement #${data?.id} - ${AppConfig.app.name}`}</title>
      </Head>
      <TransferRequestView data={data} />
    </>
  )
}

ControllerView.getLayout = function getLayout(page: ReactElement) {
  const data = page.props.data
  const hasApprovalBar = data?.approversGroup?.length > 1
  return (
    <Layout title={`Transfer Request #${data?.id}`} defaultPadding={!hasApprovalBar}>
      {page}
    </Layout>
  )
}

export const getServerSideProps = withControllerSSR(async ({ user, query }) => {
  const { data, error } = await getTransferRequestById({
    transferRequestId: query.id as string,
  })

  if (error) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      user,
      data: JSON.parse(JSON.stringify(data)),
    },
  }
})

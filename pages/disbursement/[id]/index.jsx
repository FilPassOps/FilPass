import { TransferRequestView } from 'components/Controller/TransferRequestView'
import { Layout } from 'components/Layout'
import { PLATFORM_NAME } from 'system.config'
import { getTransferRequestById } from 'domain/transferRequest/getTransferRequestById'
import { withControllerSSR } from 'lib/ssr'

export default function ControllerView({ data }) {
  return (
    <>
      <TransferRequestView data={data} />
    </>
  )
}

ControllerView.getLayout = function getLayout(page) {
  const data = page.props.data
  const hasApprovalBar = data?.approversGroup?.length > 1
  return (
    <Layout title={`Transfer Request #${data?.id} - ${PLATFORM_NAME}`} defaultPadding={!hasApprovalBar}>
      {page}
    </Layout>
  )
}

export const getServerSideProps = withControllerSSR(async ({ user, query }) => {
  const { data, error } = await getTransferRequestById({
    transferRequestId: query.id,
    userId: user.id,
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

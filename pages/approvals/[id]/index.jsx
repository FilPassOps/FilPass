import { TransferRequestView } from 'components/Approver/TransferRequestView'
import { Layout } from 'components/Layout'
import { PLATFORM_NAME } from 'system.config'
import { getApprovalDetailsByRole } from 'domain/approvals/service'
import { APPROVER_ROLE, VIEWER_ROLE } from 'domain/auth/constants'
import { withRolesSSR } from 'lib/ssr'
import Head from 'next/head'

export default function ApproverViewAwaiting({ data }) {
  return (
    <>
      <Head>
        <title>
          {`Approval #${data?.id} - ${PLATFORM_NAME}`}
        </title>
      </Head>
      <TransferRequestView data={data} />
    </>
  )
}

ApproverViewAwaiting.getLayout = function getLayout(page) {
  const data = page.props.data
  const hasApprovalBar = data?.approversGroup?.length > 1
  return (
    <Layout title={`Transfer Request #${data?.id} - ${PLATFORM_NAME}`} defaultPadding={!hasApprovalBar}>
      {page}
    </Layout>
  )
}

export const getServerSideProps = withRolesSSR([APPROVER_ROLE, VIEWER_ROLE], async ({ user, query }) => {
  const { id, roles } = user

  const { data, error } = await getApprovalDetailsByRole({ transferRequestId: query.id, roles, userId: id })

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

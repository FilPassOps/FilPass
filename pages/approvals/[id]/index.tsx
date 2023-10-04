import { TransferRequestView } from 'components/Approver/TransferRequestView'
import { Layout } from 'components/Layout'
import { ViewTransferRequestProps } from 'components/TransferRequest/ViewTransferRequest'
import { getApprovalDetailsByRole } from 'domain/approvals/service'
import { APPROVER_ROLE, VIEWER_ROLE } from 'domain/auth/constants'
import { withRolesSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement } from 'react'
import { AppConfig } from 'system.config'

export type TransferRequestViewProps = Omit<ViewTransferRequestProps, 'role'> & {
  role?: string
}

export default function ApproverViewAwaiting({ data }: TransferRequestViewProps) {
  return (
    <>
      <Head>
        <title>{`Approval #${data?.id} - ${AppConfig.app.name}`}</title>
      </Head>
      <TransferRequestView data={data} />
    </>
  )
}

ApproverViewAwaiting.getLayout = function getLayout(page: ReactElement) {
  const data = page.props.data
  const hasApprovalBar = data?.approversGroup?.length > 1
  return (
    <Layout title={`Transfer Request #${data?.id} - ${AppConfig.app.name}`} defaultPadding={!hasApprovalBar}>
      {page}
    </Layout>
  )
}

export const getServerSideProps = withRolesSSR([APPROVER_ROLE, VIEWER_ROLE], async ({ user, query }) => {
  const { id, roles } = user

  const { data, error } = await getApprovalDetailsByRole({ transferRequestId: query.id as string, roles, userId: id })

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

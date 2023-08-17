import { TransferRequestEdit } from 'components/Approver/TransferRequestEdit'
import { Layout } from 'components/Layout'
import { PLATFORM_NAME } from 'system.config'
import { APPROVED_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_BY_APPROVER_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import { getApproverTransferRequestById } from 'domain/transferRequest/getApproverTransferRequestById'
import { withApproverSSR } from 'lib/ssr'

export default function ApproverViewAwaiting({ data }) {
  return (
    <>
      <TransferRequestEdit data={data} />
    </>
  )
}

ApproverViewAwaiting.getLayout = function getLayout(page) {
  const data = page.props.data
  return <Layout title={`Edit Transfer Request #${data?.id} - ${PLATFORM_NAME}`}>{page}</Layout>
}
export const getServerSideProps = withApproverSSR(async ({ user, query }) => {
  const { data, error } = await getApproverTransferRequestById({
    transferRequestId: query.id,
    userId: user.id,
  })

  const showEdit = [SUBMITTED_STATUS, APPROVED_STATUS, REQUIRES_CHANGES_STATUS, SUBMITTED_BY_APPROVER_STATUS].includes(data?.status)

  if (error || !showEdit) {
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

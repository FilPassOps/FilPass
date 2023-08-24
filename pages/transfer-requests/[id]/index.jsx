import { Layout } from 'components/Layout'
import { TransferDetails } from 'components/User/TransferDetails'
import { PLATFORM_NAME } from 'system.config'
import { getUserTransferRequestById } from 'domain/transferRequest/getUserTransferRequestById'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'

export default function TransferRequestDetails({ data }) {
  return (
    <>
      <Head>
        <title>
          {`Transfer Request #${data?.id} - ${PLATFORM_NAME}`}
        </title>
      </Head>
      <TransferDetails data={data} />
    </>
  )
}

TransferRequestDetails.getLayout = function getLayout(page) {
  const data = page.props.data
  return <Layout title={`Transfer Request #${data?.id}`}>{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ user, query }) => {
  const { data, error } = await getUserTransferRequestById({
    transferRequestId: query.id,
    userId: user.id,
  })

  if (error || data?.isDraft) {
    return {
      notFound: true,
    }
  }

  delete data.sanctionReason
  delete data.receiver_is_banned
  delete data.ban_actioner_email
  delete data.banActionedBy

  return {
    props: {
      user,
      data: JSON.parse(JSON.stringify(data)),
    },
  }
})

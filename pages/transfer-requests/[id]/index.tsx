import { Layout } from 'components/Layout'
import { TransferDetails, TransferRequestDetailsProps } from 'components/User/TransferDetails'
import { AppConfig } from 'config'
import { getUserTransferRequestById } from 'domain/transfer-request/get-user-transfer-request-by-id'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement } from 'react'

export default function TransferRequestDetails({ data }: TransferRequestDetailsProps) {
  return (
    <>
      <Head>
        <title>{`Transfer Request #${data?.id} - ${AppConfig.app.name}`}</title>
      </Head>
      <TransferDetails data={data} />
    </>
  )
}

TransferRequestDetails.getLayout = function getLayout(page: ReactElement) {
  const data = page.props.data
  return <Layout title={`Transfer Request #${data?.id}`}>{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ user, query }) => {
  const { data, error } = await getUserTransferRequestById({
    transferRequestId: query.id as string,
    userId: user.id,
  })

  if (error || data?.isDraft) {
    return {
      notFound: true,
    }
  }

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

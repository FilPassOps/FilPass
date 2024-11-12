import { Layout } from 'components/Layout'
import { withSuperAdminSSR } from 'lib/ssr'
import Head from 'next/head'
import { NextPageWithLayout } from './_app'
import { CheckTransaction } from 'components/SuperAdmin/CheckTransaction'

const AdminTools: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Admin Tools </title>
      </Head>
      <div className="w-full">
        <CheckTransaction />
      </div>
    </>
  )
}

export default AdminTools

AdminTools.getLayout = function getLayout(page) {
  return <Layout title="Admin Tools">{page}</Layout>
}

export const getServerSideProps = withSuperAdminSSR(async () => {
  return {
    props: {},
  }
})

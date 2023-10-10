import { Layout } from 'components/Layout'
import { ApplyForSomeoneForm } from 'components/TransferRequest/ApplyingForSomeoneForm'
import { TransferRequestForm } from 'components/TransferRequest/TransferRequestForm'
import { GoBackConfirmationWithRouter } from 'components/shared/GoBackConfirmation'
import { AppConfig } from 'config'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { findAllExternalPrograms } from 'domain/programs/findAll'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement } from 'react'

interface CreateTransferRequestProps {
  programs: any[]
  applyingForSomeone: boolean
}

export default function CreateTransferRequest({ programs, applyingForSomeone }: CreateTransferRequestProps) {
  return (
    <>
      <Head>
        <title>{`New Transfer Request - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="max-w-3xl mx-auto">{applyingForSomeone ? <ApplyForSomeoneForm /> : <TransferRequestForm programs={programs} />}</div>
      <GoBackConfirmationWithRouter />
    </>
  )
}

CreateTransferRequest.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="New Transfer Request">{page}</Layout>
}

export const getServerSideProps = withUserSSR(async function getServerSideProps({ user, query }) {
  const { roles } = user

  const { data: programs } = await findAllExternalPrograms()

  return {
    props: {
      programs: JSON.parse(JSON.stringify(programs)),
      applyingForSomeone: query?.batch === 'true' && roles?.some(({ role }) => role === APPROVER_ROLE),
    },
  }
})

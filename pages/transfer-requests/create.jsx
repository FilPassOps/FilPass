import { Layout } from 'components/Layout'
import { GoBackConfirmationWithRouter } from 'components/shared/GoBackConfirmation'
import { ApplyForSomeoneForm } from 'components/TransferRequest/ApplyingForSomeoneForm'
import { TransferRequestForm } from 'components/TransferRequest/TransferRequestForm'
import { PLATFORM_NAME } from 'system.config'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { findAllExternalPrograms } from 'domain/programs/findAll'
import { getMasterWallet } from 'lib/filecoin'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'

export default function CreateTransferRequest({ programs, masterAddress, applyingForSomeone }) {
  return (
    <>
      <Head>
        <title>New Transfer Request - {PLATFORM_NAME}</title>
      </Head>
      <div className="max-w-3xl mx-auto">
        {applyingForSomeone ? (
          <ApplyForSomeoneForm />
        ) : (
          <TransferRequestForm programs={programs} applyingForSomeone={applyingForSomeone} masterAddress={masterAddress} />
        )}
      </div>
      <GoBackConfirmationWithRouter />
    </>
  )
}

CreateTransferRequest.getLayout = function getLayout(page) {
  return <Layout title="New Transfer Request">{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ user, query }) => {
  const { isSanctioned, isReviewedByCompliance, roles } = user

  if (isReviewedByCompliance && isSanctioned) {
    return {
      redirect: {
        destination: '/flagged-account',
      },
    }
  }

  const { data: programs } = await findAllExternalPrograms()
  const masterWallet = getMasterWallet()

  return {
    props: {
      programs: JSON.parse(JSON.stringify(programs)),
      masterAddress: masterWallet.address,
      applyingForSomeone: query?.batch === 'true' && roles?.some(({ role }) => role === APPROVER_ROLE),
    },
  }
})

import { Layout } from 'components/Layout'
import { GoBackConfirmationWithRouter } from 'components/shared/GoBackConfirmation'
import { ApplyForSomeoneForm } from 'components/TransferRequest/ApplyingForSomeoneForm'
import { TransferRequestForm } from 'components/TransferRequest/TransferRequestForm'
import { PLATFORM_NAME } from 'system.config'
import { APPROVER_ROLE } from 'domain/auth/constants'
import { findAllExternalPrograms } from 'domain/programs/findAll'
import { getMasterWallet } from 'lib/filecoin'
import { withUserSSR } from 'lib/ssr'
import { ReactElement } from 'react'

interface CreateTransferRequestProps {
  programs: any[]
  masterAddress: string
  applyingForSomeone: boolean
}

export default function CreateTransferRequest({ programs, masterAddress, applyingForSomeone }: CreateTransferRequestProps) {
  return (
    <>
      <div className="max-w-3xl mx-auto">
        {applyingForSomeone ? (
          <ApplyForSomeoneForm />
        ) : (
          <TransferRequestForm programs={programs} masterAddress={masterAddress} />
        )}
      </div>
      <GoBackConfirmationWithRouter />
    </>
  )
}

CreateTransferRequest.getLayout = function getLayout(page: ReactElement) {
  return <Layout title={`New Transfer Request - ${PLATFORM_NAME}`}>{page}</Layout>
}

export const getServerSideProps = withUserSSR(async function getServerSideProps({ user, query }) {
  const { isSanctioned, isReviewedByCompliance, roles } = user

  if (isReviewedByCompliance && isSanctioned) {
    return {
      redirect: {
        destination: '/flagged-account',
        permanent: false
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

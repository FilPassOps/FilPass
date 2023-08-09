import { LockClosedIcon } from '@heroicons/react/24/solid'
import { Layout } from 'components/Layout'
import { LinkButton } from 'components/shared/Button'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { ReactElement } from 'react'
import { PLATFORM_NAME, SUPPORT_EMAIL } from 'system.config'

export default function FlaggedAccountPage() {
  return (
    <>
      <Head>
        <title>Flagged Account - {PLATFORM_NAME}</title>
      </Head>
      <div className="h-full flex flex-col justify-center items-center mt-20">
        <LockClosedIcon className="w-14 h-14 text-gray-500 mb-3" />
        <h1 className="text-gray-500 text-3xl font-bold mb-3">Flagged Account</h1>
        <p className="text-base font-normal text-gray-500 mb-9 text-center">
          Your account has been flagged for a potential sanction. <br />
          If you believe this is a mistake contact{' '}
          <a className="text-purple-500" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
        <div className="w-44">
          <LinkButton variant="primary" href="/my-transfer-requests">
            Go Back
          </LinkButton>
        </div>
      </div>
    </>
  )
}
FlaggedAccountPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="Transfer Request">{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ user }: any) => {
  const { isSanctioned, isReviewedByCompliance } = user

  if (!isSanctioned || !isReviewedByCompliance) {
    return {
      redirect: {
        destination: '/my-transfer-requests',
      },
    }
  }

  return {
    props: {},
  }
})

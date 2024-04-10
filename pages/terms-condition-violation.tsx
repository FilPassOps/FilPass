import { LockClosedIcon } from '@heroicons/react/24/solid'
import { Button } from 'components/Shared/Button'
import { AppConfig } from 'config'
import { isUserBanned } from 'domain/user/is-user-banned'
import { withSessionSSR } from 'lib/ssr'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function BannedUserPage() {
  const { push } = useRouter()

  const handleGoBack = async () => {
    push('/')
  }

  return (
    <>
      <Head>
        <title key="terms-conditions">{`Terms and Condition violation - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="h-screen flex flex-col justify-center items-center">
        <LockClosedIcon className="w-14 h-14 text-gray-500 mb-3" />
        <h1 className="text-gray-500 text-3xl font-bold mb-3">Terms and Condition violation</h1>
        <p className="text-base font-normal text-gray-500 mb-9 text-center">
          Your account is prohibited to use the {AppConfig.app.name} platform because of a violation of our terms and conditions. <br />
          If you believe this is a mistake contact{' '}
          <a className="text-green-700" href={`mailto:${AppConfig.app.emailConfig.supportAddress}`}>
            {AppConfig.app.emailConfig.supportAddress}
          </a>
        </p>
        <div className="w-44">
          <Button variant="outline" onClick={handleGoBack}>
            Go Back
          </Button>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps = withSessionSSR(async function getServerSideProps({ req }) {
  const user = req.session.user

  if (!user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  const isBanned = await isUserBanned(user.id)
  if (!isBanned) {
    return {
      redirect: {
        destination: '/my-transfer-requests',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
})

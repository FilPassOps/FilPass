import { LockClosedIcon } from '@heroicons/react/24/solid'
import { Button } from 'components/shared/Button'
import { PLATFORM_NAME, SUPPORT_EMAIL } from 'system.config'
import { isUserBanned } from 'domain/user/isUserBanned'
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
        <title>Terms and Condition violation - {PLATFORM_NAME}</title>
      </Head>
      <div className="h-screen flex flex-col justify-center items-center">
        <LockClosedIcon className="w-14 h-14 text-gray-500 mb-3" />
        <h1 className="text-gray-500 text-3xl font-bold mb-3">Terms and Condition violation</h1>
        <p className="text-base font-normal text-gray-500 mb-9 text-center">
          Your account is prohibited to use the {PLATFORM_NAME} platform because of a violation of our terms and conditions. <br />
          If you believe this is a mistake contact{' '}
          <a className="text-purple-500" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
        <div className="w-44">
          <Button variant="primary" onClick={handleGoBack}>
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

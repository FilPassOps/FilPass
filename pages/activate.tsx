import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Button } from 'components/Shared/Button'
import { AppConfig } from 'config'
import { verifyAccount } from 'domain/auth/verify-account'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import NextLink from 'next/link'

export default function Activate({ error }: { error: any }) {
  return (
    <>
      <Head>
        <title key="activate-account">{`Activate Account - ${AppConfig.app.name}`}</title>
      </Head>
      {error ? (
        <div className="flex flex-col h-screen items-center justify-center">
          <XCircleIcon className="text-red-500 w-20 h-20 mb-6" />
          <h1 className="text-2xl text-center font-bold mb-8">{error?.token?.message}</h1>
          <div>
            <NextLink href="/signup" legacyBehavior>
              <Button>Go to SignUp</Button>
            </NextLink>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen items-center justify-center">
          <CheckCircleIcon className="text-green-500 w-20 h-20 mb-6" />
          <h1 className="text-2xl font-bold mb-8">Account activated!</h1>
          <div>
            <NextLink href="/" legacyBehavior>
              <Button>Go to Login</Button>
            </NextLink>
          </div>
        </div>
      )}
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { token } = query
  const { data, error } = await verifyAccount({ token: (token as string) || undefined })

  if (error) {
    return {
      props: {
        error: error.errors,
      },
    }
  }

  return {
    props: { data },
  }
}

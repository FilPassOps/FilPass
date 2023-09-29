import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Button } from 'components/shared/Button'
import { PLATFORM_NAME } from 'system.config'
import { setDefault } from 'domain/wallet/setDefault'
import Head from 'next/head'
import NextLink from 'next/link'
import { GetServerSidePropsContext } from 'next'

interface SetDefaultWalletProps {
  error?: {
    token?: {
      message?: string
    }
  }
}

export default function SetDefaultWallet({ error }: SetDefaultWalletProps) {
  return (
    <>
      <Head>
        <title key="default-wallet">{`Set default wallet - ${PLATFORM_NAME}`}</title>
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
          <h1 className="text-2xl font-bold mb-8">Default Wallet Set!</h1>
          <div>
            <NextLink href="/profile-settings" legacyBehavior>
              <Button>Go to Wallet Settings</Button>
            </NextLink>
          </div>
        </div>
      )}
    </>
  )
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { token } = ctx.query
  const { data, error } = await setDefault({ token: token as string | undefined })

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

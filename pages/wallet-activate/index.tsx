import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { setWalletActive } from 'domain/wallet/setWalletActive'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useEffect } from 'react'
import { PLATFORM_NAME } from 'system.config'
export default function WalletActivate({ error }: { error?: { message: string } }) {
  useEffect(() => {
    if (window) {
      setTimeout(() => {
        return window.location.replace('/profile-settings')
      }, 1500)
    }
  })
  return (
    <>
      <Head>
        <title>Activate Account - {PLATFORM_NAME}</title>
      </Head>
      {error ? (
        <div className="flex flex-col h-screen items-center justify-center">
          <XCircleIcon className="text-red-500 w-20 h-20 mb-6" />
          <h1 className="text-2xl text-center font-bold mb-8">Error</h1>
          <p className="text-lg text-center">{error?.message}</p>
        </div>
      ) : (
        <div className="flex flex-col h-screen items-center justify-center">
          <CheckCircleIcon className="text-green-500 w-20 h-20 mb-6" />
          <h1 className="text-2xl font-bold mb-8">Success</h1>
        </div>
      )}
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { token } = query

  if (!token) {
    return { props: { error: { message: 'Token not found' } } }
  }

  const { error } = await setWalletActive({ token: token as string })
  if (error) {
    return { props: { error } }
  }

  return { props: {} }
}

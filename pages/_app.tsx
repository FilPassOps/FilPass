import { AuthProvider } from 'components/Authentication/Provider'
import { AlertContainer, AlertDispatcherProvider } from 'components/Layout/Alerts'
import { OnboardContextProvider, OnboardWrapper } from 'components/OnboardingWrapper'
import { Button } from 'components/shared/Button'
import { MetaMaskProvider } from 'components/web3/MetaMaskProvider'
import { NextPage } from 'next'
import type { AppProps } from 'next/app'
import Image from 'next/legacy/image'
import Router from 'next/router'
import NProgress from 'nprogress'
import { ReactElement, ReactNode } from 'react'
import 'react-datepicker/dist/react-datepicker.css'
import 'styles/globals.css'
import { SWRConfig } from 'swr'
import 'tailwindcss/tailwind.css'

Router.events.on('routeChangeStart', () => NProgress.start())
Router.events.on('routeChangeComplete', () => NProgress.done())
Router.events.on('routeChangeError', () => NProgress.done())

const NEXT_PUBLIC_DEPLOY_TYPE = process.env.NEXT_PUBLIC_VERCEL_ENV

export type GetPage = (page: ReactElement) => ReactNode

export type NextPageWithLayout<P = unknown, IP = P> = NextPage<P, IP> & {
  getLayout?: GetPage
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const fallbackLayout: GetPage = page => page

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? fallbackLayout

  if (NEXT_PUBLIC_DEPLOY_TYPE) {
    setTimeout(() => {
      if (window) {
        return window.location.replace('https://pl.coinemissary.com')
      }
    }, 5000)
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <div className="h-40 mb-9 w-full relative cursor-pointer">
          <Image src="/logo.svg" alt="Logo" layout="fill" objectFit="contain" quality="100" />
        </div>
        <h1 className="text-2xl text-center font-bold mb-8">
          This URL is out of date, you will be redirected in 5 seconds to{' '}
          <a href="https://pl.coinemissary.com" className="underline">
            https://pl.coinemissary.com
          </a>
        </h1>
        <div>
          <a href="https://pl.coinemissary.com">
            {/* @ts-ignore */}
            <Button>Visit New URL</Button>
          </a>
        </div>
      </div>
    )
  }
  return (
    <AuthProvider>
      <SWRConfig value={{ provider: () => new Map() }}>
        <OnboardContextProvider>
          <MetaMaskProvider>
            <AlertDispatcherProvider>
              <AlertContainer />
              {getLayout(<Component {...pageProps} />)}
            </AlertDispatcherProvider>
          </MetaMaskProvider>
          <OnboardWrapper />
        </OnboardContextProvider>
      </SWRConfig>
    </AuthProvider>
  )
}

export default MyApp

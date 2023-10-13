import { AuthProvider } from 'components/Authentication/Provider'
import { AlertContainer, AlertDispatcherProvider } from 'components/Layout/Alerts'
import { OnboardContextProvider, OnboardWrapper } from 'components/OnboardingWrapper'
import { MetaMaskProvider } from 'components/Web3-tmp/MetaMaskProvider'
import { NextPage } from 'next'
import type { AppProps } from 'next/app'
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

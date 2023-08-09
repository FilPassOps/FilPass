import { Login as LoginComponent } from 'components/Authentication/Login'
import { withSessionSSR } from 'lib/ssr'
import Head from 'next/head'
import Cookie from 'js-cookie'
import { useEffect, useState } from 'react'
import { PLATFORM_NAME } from 'system.config'

export default function Login() {
  const [redirect, setRedirect] = useState<any>(null)
  useEffect(() => {
    const fromCookie = Cookie.get('@PL:fromDraftEmail')
    if (!fromCookie) return

    const parsedFrom = JSON.parse(fromCookie)
    if (parsedFrom?.id) {
      const url = `/transfer-requests/${parsedFrom.id}/edit`
      setRedirect(url)
    }
  }, [])
  return (
    <>
      <Head>
        <title>Login - {PLATFORM_NAME}</title>
      </Head>
      <LoginComponent redirectAfterLogin={redirect} />
    </>
  )
}

export const getServerSideProps = withSessionSSR(async () => {
  return {
    props: {},
  }
})

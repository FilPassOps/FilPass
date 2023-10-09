import { Login as LoginComponent } from 'components/Authentication/Login'
import { AppConfig } from 'config'
import Cookie from 'js-cookie'
import Head from 'next/head'
import { useEffect, useState } from 'react'

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
        <title key="login">{`Login - ${AppConfig.app.name}`}</title>
      </Head>
      <LoginComponent redirectAfterLogin={redirect} />
    </>
  )
}

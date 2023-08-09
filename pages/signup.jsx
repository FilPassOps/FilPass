import { SignUp as SignUpComponent } from 'components/Authentication/SignUp'
import { PLATFORM_NAME } from 'system.config'
import Cookie from 'js-cookie'
import { withSessionSSR } from 'lib/ssr'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function SignUp() {
  const { query } = useRouter()

  useEffect(() => {
    if (query?.from === 'draft-email') {
      Cookie.set('@PL:fromDraftEmail', JSON.stringify(query), { expires: 14 })
    }
  }, [query])

  return (
    <>
      <Head>
        <title>Sign Up - {PLATFORM_NAME}</title>
      </Head>
      <SignUpComponent />
    </>
  )
}

export const getServerSideProps = withSessionSSR(async ({ req }) => {
  const user = req.session.user
  if (user) {
    return {
      redirect: {
        permanent: true,
        destination: '/my-transfer-requests',
      },
    }
  }

  return {
    props: {},
  }
})

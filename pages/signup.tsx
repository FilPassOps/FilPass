import { SignUp as SignUpComponent } from 'components/Authentication/SignUp'
import { AppConfig } from 'config'
import Cookie from 'js-cookie'
import { withSessionSSR } from 'lib/ssr'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function SignUp() {
  const { query } = useRouter()

  useEffect(() => {
    if (query?.from === 'draft-email') {
      Cookie.set('@Emissary:fromDraftEmail', JSON.stringify(query), { expires: 14 })
    }
  }, [query])

  return (
    <>
      <Head>
        <title key="sign-up">{`Sign Up - ${AppConfig.app.name}`}</title>
      </Head>
      <SignUpComponent />
    </>
  )
}
export const getServerSideProps = withSessionSSR(async function getServerSideProps({ req }) {
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

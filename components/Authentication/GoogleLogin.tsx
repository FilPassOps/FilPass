import { LinkButton } from 'components/Shared-tmp/Button'
import { GoogleIcon } from 'components/Shared-tmp/icons/GoogleIcon'
import { api } from 'lib/api'
import { googleLoginUrl } from 'lib/google/google-oauth-url'
import { useRouter } from 'next/router'
import NProgress from 'nprogress'
import { useEffect } from 'react'
import { useAuth } from './Provider'

interface GoogleLoginProps {
  buttonText: string
}

export const GoogleLogin = ({ buttonText }: GoogleLoginProps) => {
  const router = useRouter()
  const { refresh } = useAuth()

  useEffect(() => {
    if (router.query?.code) {
      handleGoogleLogin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query?.code])

  async function handleGoogleLogin() {
    NProgress.start()
    const { error } = await api.post('/auth/google', {
      code: router.query.code,
    })
    if (error) {
      router.push('/login')
      NProgress.done()
    } else {
      await refresh()
      return router.push('/my-transfer-requests')
    }
  }

  return (
    <LinkButton variant="secondary" href={googleLoginUrl}>
      <span className="flex items-center">
        <GoogleIcon className="mr-2.5" /> {buttonText}
      </span>
    </LinkButton>
  )
}

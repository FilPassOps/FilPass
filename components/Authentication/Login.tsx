import { yupResolver } from '@hookform/resolvers/yup'
import { Button, LinkButton } from 'components/Shared/Button'
import { PasswordInput, TextInput } from 'components/Shared/FormInput'
import { loginValidator } from 'domain/auth/validation'
import Cookie from 'js-cookie'
import { api } from 'lib/api'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { KeyedMutator } from 'swr'
import { GoogleLogin } from './GoogleLogin'
import { useAuth } from './Provider'
import { Layout } from './Shared'

const ForgotPasswordModal = dynamic(() => import('components/Authentication/ForgotPasswordModal').then(mod => mod.default))
const ResetPasswordModal = dynamic(() => import('components/Authentication/ResetPasswordModal').then(mod => mod.default))
const SecurityCodeModal = dynamic(() => import('components/Authentication/SecurityCodeModal').then(mod => mod.SecurityCodeModal))
const ResendVerificationModal = dynamic(() => import('./ResendVerificationModal').then(mod => mod.ResendVerificationModal))

interface LoginProps {
  redirectAfterLogin: string
}

interface AuthContextProps {
  user: any
  refresh: KeyedMutator<any>
}

export function Login({ redirectAfterLogin }: LoginProps) {
  const { refresh } = useAuth() as AuthContextProps
  const router = useRouter()
  const [submitErrors, setSubmitErrors] = useState<any>()
  const [openModal, setOpenModal] = useState(false)
  const [openVerifyModal, setOpenVerifyModal] = useState(false)
  const [openForgotPassModal, setOpenForgotPassModal] = useState(false)
  const [openResetPassModal, setOpenResetPassModal] = useState(false)
  const [userData, setUserData] = useState<any>()

  const NEXT_PUBLIC_GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    setOpenResetPassModal(!!router?.query?.token)
  }, [router?.query?.token])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: yupResolver(loginValidator),
  })

  const email = watch('email')

  const handleFormSubmit = async (values: any) => {
    setSubmitErrors(undefined)

    const { data, error: loginError } = await api.post('/auth/login', {
      ...values,
    })

    setUserData(data)
    if (loginError) {
      // Send email verification if user is not verified
      if (loginError.errors?.verification) {
        const { error: verificationError } = await api.post('/auth/send-email-verification', {
          email,
        })
        if (verificationError) {
          return setSubmitErrors(verificationError.errors)
        }
        return setOpenModal(true)
      }
      return setSubmitErrors(loginError.errors)
    }
    return setOpenVerifyModal(true)
  }

  const handleCodeSubmit = async (code: string) => {
    const { error: verifyError } = await api.post('/auth/verify-code', {
      code,
      token: userData.token,
    })

    if (verifyError) {
      return { error: verifyError } as { error: any }
    }

    refresh()
    if (redirectAfterLogin) {
      Cookie.remove('@Emissary:fromDraftEmail')
      router.push(redirectAfterLogin)
      return { error: undefined }
    } else {
      router.push('/my-transfer-requests')
      return { error: undefined }
    }
  }

  const handleResend = async () => {
    const { error: verifyError } = await api.post('/auth/resend-code', {
      token: userData.token,
    })

    if (verifyError) {
      return { error: verifyError } as { error: any }
    }

    return { error: undefined }
  }

  return (
    <Layout>
      <div className="h-full w-full flex flex-col justify-center space-y-6 px-8 md:px-0">
        {NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <>
            <GoogleLogin buttonText="Login with Google" />
            <p className="text-center">or</p>
          </>
        )}

        <form noValidate={true} className="h-full w-full flex flex-col justify-center space-y-6" onSubmit={handleSubmit(handleFormSubmit)}>
          <TextInput
            // @ts-ignore
            id="email"
            type="email"
            autoComplete="email"
            label="Email"
            error={errors.email || submitErrors?.email}
            {...register('email')}
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenForgotPassModal(true)}
              className="absolute right-0 text-sm text-indigo-600 font-bold"
            >
              Forgot password?
            </button>
            {/* @ts-ignore */}
            <PasswordInput id="password" label="Password" error={errors.password || submitErrors?.password} {...register('password')} />
          </div>
          <div>
            <div className="h-full w-full flex flex-col justify-center space-y-6 mt-3">
              {/* @ts-ignore */}
              <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
                Login
              </Button>
              <p className="text-center">or</p>
              <LinkButton variant="outline" href="/signup">
                Sign up
              </LinkButton>
            </div>
          </div>
        </form>

        {openForgotPassModal && <ForgotPasswordModal open={openForgotPassModal} onClose={() => setOpenForgotPassModal(false)} />}

        {openResetPassModal && (
          <ResetPasswordModal open={openResetPassModal} onClose={() => setOpenResetPassModal(false)} token={router.query.token as string} />
        )}

        {openModal && (
          <ResendVerificationModal
            openModal={openModal}
            email={email}
            onModalClosed={() => setOpenModal(false)}
            setSubmitErrors={setSubmitErrors}
            errorMessage={submitErrors?.verification?.message}
          />
        )}

        {openVerifyModal && (
          <SecurityCodeModal
            open={openVerifyModal}
            onClose={() => {
              setOpenVerifyModal(false)
            }}
            email={email}
            handleVerifyCode={handleCodeSubmit}
            onResend={handleResend}
          />
        )}
      </div>
    </Layout>
  )
}

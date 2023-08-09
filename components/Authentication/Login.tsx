import { yupResolver } from '@hookform/resolvers/yup'
import ForgotPasswordModal from 'components/Authentication/ForgotPasswordModal'
import ResetPasswordModal from 'components/Authentication/ResetPasswordModal'
import { SecurityCodeModal } from 'components/Authentication/SecurityCodeModal'
import { Button, LinkButton } from 'components/shared/Button'
import { PasswordInput, TextInput } from 'components/shared/FormInput'
import { loginValidator } from 'domain/auth/validation'
import Cookie from 'js-cookie'
import { api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { KeyedMutator } from 'swr'
import { GoogleLogin } from './GoogleLogin'
import { useAuth } from './Provider'
import { ResendVerificationModal } from './ResendVerificationModal'
import { Layout } from './Shared'

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
  const [openResetPassModal, setOpenResetPassModal] = useState(!!router?.query?.token || false)
  const [userData, setUserData] = useState<any>()

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
      return { error: verifyError }
    }

    refresh()
    if (redirectAfterLogin) {
      Cookie.remove('@PL:fromDraftEmail')
      return router.push(redirectAfterLogin)
    } else {
      return router.push('/my-transfer-requests')
    }
  }

  const handleResend = async () => {
    const { error: verifyError } = await api.post('/auth/resend-code', {
      token: userData.token,
    })

    if (verifyError) {
      return { error: verifyError }
    }

    return {}
  }

  return (
    <Layout>
      <div className="h-full w-full flex flex-col justify-center space-y-6 px-8 md:px-0">
        <GoogleLogin buttonText="Login with Google" />

        <p className="text-center">or</p>
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

        <ForgotPasswordModal open={openForgotPassModal} onClose={() => setOpenForgotPassModal(false)} />

        <ResetPasswordModal open={openResetPassModal} onClose={() => setOpenResetPassModal(false)} token={router.query.token} />

        <ResendVerificationModal
          openModal={openModal}
          email={email}
          onModalClosed={() => setOpenModal(false)}
          setSubmitErrors={setSubmitErrors}
          errorMessage={submitErrors?.verification?.message}
        />

        <SecurityCodeModal
          open={openVerifyModal}
          onClose={() => {
            setOpenVerifyModal(false)
          }}
          email={email}
          handleVerifyCode={handleCodeSubmit}
          onResend={handleResend}
        />
      </div>
    </Layout>
  )
}

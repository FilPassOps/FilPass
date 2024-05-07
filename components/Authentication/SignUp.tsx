import { yupResolver } from '@hookform/resolvers/yup'
import { Button, LinkButton } from 'components/Shared/Button'
import { PasswordInput, TextInput } from 'components/Shared/FormInput'
import { signupValidator } from 'domain/auth/validation'
import { api } from 'lib/api'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { GoogleLogin } from './GoogleLogin'
import { ResendVerificationModal } from './ResendVerificationModal'
import { Layout } from './Shared'
import { AppConfig } from 'config/system'

export function SignUp() {
  const [openModal, setOpenModal] = useState(false)
  const [submitErrors, setSubmitErrors] = useState<any>()
  const [genericError, setGenericError] = useState<any>()

  const NEXT_PUBLIC_GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    resolver: yupResolver(signupValidator),
  })
  const email = watch('email')

  const handleFormSubmit = async (values: { email: string; password: string; confirmPassword: string }) => {
    setSubmitErrors(null)
    setGenericError(null)
    const { error } = await api.post('/auth/signup', values)

    if (error) {
      if (error.message) {
        setGenericError(error.message)
        return
      }
      setSubmitErrors(error.errors)
      return
    }

    setOpenModal(true)
  }

  return (
    <Layout>
      <p className='font-medium'>Operated by {AppConfig.app.companyName}</p>

      <div className="h-full w-full flex flex-col justify-center space-y-4 px-8 md:px-0">
        {NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <>
            <GoogleLogin buttonText="Sign up with Google" />
            <p className="text-center">or</p>
          </>
        )}

        <form noValidate={true} className="h-full w-full flex flex-col justify-center space-y-6" onSubmit={handleSubmit(handleFormSubmit)}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            label="Email"
            error={errors.email || submitErrors?.email}
            {...register('email')}
          />
          <PasswordInput id="password" label="Password" error={errors.password || submitErrors?.password} {...register('password')} />
          <PasswordInput
            id="confirm-password"
            label="Confirm Password"
            error={errors.confirmPassword || submitErrors?.confirmPassword}
            {...register('confirmPassword')}
          />
          <p className="text-sm">
            By pressing <strong>Sign Up</strong>
            {NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <>
                {' '}
                or <strong>Sign up with Google </strong>
              </>
            )}{' '}
            you agree to our{' '}
            <a
              href="https://github.com/protocol/coinemissary/blob/main/docs/terms-and-conditions.md"
              className="text-blue-600 hover:text-blue-800"
              rel="noopener noreferrer"
              target="_blank"
            >
              terms and conditions
            </a>{' '}
            and acknowledge you have read our{' '}
            <a
              href="https://github.com/protocol/coinemissary/blob/main/docs/private-policy.md"
              className="text-blue-600 hover:text-blue-800"
              rel="noopener noreferrer"
              target="_blank"
            >
              privacy policy
            </a>
            .
          </p>
          <div>
            <div className="h-full w-full flex flex-col justify-center space-y-4 mt-6">
              <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                Sign up
              </Button>
              <p className="text-center">or</p>
              <LinkButton variant="outline" href="/">
                Login
              </LinkButton>
            </div>
          </div>
        </form>
        {genericError && <p className="mt-1 text-sm text-red-500">{genericError}</p>}
        <ResendVerificationModal
          openModal={openModal}
          email={email}
          onModalClosed={() => setOpenModal(false)}
          setSubmitErrors={setSubmitErrors}
        />
      </div>
    </Layout>
  )
}

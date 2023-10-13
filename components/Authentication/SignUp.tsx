import { yupResolver } from '@hookform/resolvers/yup'
import { PageAlert } from 'components/Layout/Alerts'
import { Button, LinkButton } from 'components/Shared/Button'
import { PasswordInput, TextInput } from 'components/Shared/FormInput'
import { AppConfig } from 'config'
import { signupValidator } from 'domain/auth/validation'
import { api } from 'lib/api'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { GoogleLogin } from './GoogleLogin'
import { ResendVerificationModal } from './ResendVerificationModal'
import { Layout } from './Shared'

export function SignUp() {
  const [openModal, setOpenModal] = useState(false)
  const [submitErrors, setSubmitErrors] = useState<any>()
  const [genericError, setGenericError] = useState<any>()

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
      <div className="h-full w-full flex flex-col justify-center space-y-6 px-8 md:px-0">
        <PageAlert type="info">
          <p>If you have participated in a {AppConfig.app.name} event, make sure to use the same registered email address</p>
        </PageAlert>

        <GoogleLogin buttonText="Sign up with Google" />

        <p className="text-center">or</p>
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
          <div>
            <div className="h-full w-full flex flex-col justify-center space-y-6 mt-6">
              <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                Sign up
              </Button>
              <p className="text-center">or</p>
              <LinkButton variant="outline" href="/login">
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

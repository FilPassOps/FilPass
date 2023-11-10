import { useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { Modal } from 'components/Shared/Modal'
import { Button } from 'components/Shared/Button'
import { TextInput } from 'components/Shared/FormInput'
import { api } from 'lib/api'
import { sendEmailForgotPasswordValidator } from 'domain/notifications/validation'
import { AlertIcon } from 'components/Layout/Alerts'

interface ForgotPasswordModalProps {
  open: boolean
  onClose: (open: boolean) => void
}

const ForgotPasswordModal = ({ open, onClose }: ForgotPasswordModalProps) => {
  const [submitErrors, setSubmitErrors] = useState<any>()
  const [showSuccess, setShowSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm({
    defaultValues: {
      email: '',
    },
    resolver: yupResolver(sendEmailForgotPasswordValidator),
  })

  const handleFormSubmit = async (values: { email: string }) => {
    setSubmitErrors(null)

    const { error: loginError } = await api.post('/auth/forgot-password', { ...values })

    if (loginError) {
      return setSubmitErrors(loginError.errors)
    }

    return setShowSuccess(true)
  }

  const handleClose = () => {
    onClose(false)
    clearErrors()
    setShowSuccess(false)
  }

  return (
    <Modal open={open} onModalClosed={handleClose}>
      {!showSuccess && (
        <>
          <h2 className="text-lg font-medium text-gray-900 mb-16 text-center">Forgot password</h2>
          <form noValidate={true} onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="mb-16">
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                label="Your email address"
                error={errors.email || submitErrors?.email}
                {...register('email')}
              />
            </div>
            <div className="flex flex-row pt-4">
              <Button variant="outline" className="mr-3" onClick={handleClose} loading={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting} disabled={isSubmitting}>
                Next
              </Button>
            </div>
          </form>
        </>
      )}

      {showSuccess && (
        <>
          <div className="flex justify-center items-center pb-2">
            <AlertIcon type={'success'} />
          </div>
          <div className="flex items-center justify-center"></div>
          <h1 className="my-2 font-medium text-lg leading-6 text-center">Please check your email</h1>
          <div className="text-sm leading-5 text-gray-500">
            <p className="text-gray-500 text-sm text-center mb-8">
              We have sent you an email to reset your password if there is a matched account in our system. Follow the instructions in the
              email to complete the process.
            </p>
          </div>
        </>
      )}
    </Modal>
  )
}

export default ForgotPasswordModal

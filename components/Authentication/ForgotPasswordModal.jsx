import { useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { Modal } from 'components/shared/Modal'
import { Button } from 'components/shared/Button'
import { TextInput } from 'components/shared/FormInput'
import { api } from 'lib/api'
import { sendEmailForgotPasswordValidator } from 'domain/notifications/validation'

const ForgotPasswordModal = ({ open, onClose }) => {
  const [submitErrors, setSubmitErrors] = useState()
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

  const handleFormSubmit = async (values) => {
    setSubmitErrors()

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
          <h2 className="text-lg font-medium text-gray-900 mb-16 text-center">Please check your email</h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            We’ve sent you an email to reset your password if there’s a matched account in our system. Follow the instructions in the email
            to complete the process.
          </p>
        </>
      )}
    </Modal>
  )
}

export default ForgotPasswordModal

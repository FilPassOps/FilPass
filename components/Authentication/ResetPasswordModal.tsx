import { CheckIcon } from '@heroicons/react/24/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'components/Shared/Button'
import { PasswordInput } from 'components/Shared/FormInput'
import { Modal } from 'components/Shared/Modal'
import { resetPasswordValidator } from 'domain/auth/validation'
import { api } from 'lib/api'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface ResetPasswordModalProps {
  open?: boolean
  onClose: (open: boolean) => void
  token: string
}

const ResetPasswordModal = ({ open = false, onClose, token }: ResetPasswordModalProps) => {
  const [submitErrors, setSubmitErrors] = useState<any>()
  const [showSuccess, setShowSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm({
    defaultValues: {
      password: '',
      passwordConfirm: '',
    },
    resolver: yupResolver(resetPasswordValidator),
  })

  const handleFormSubmit = async (values: { token: string; password: string; passwordConfirm: string }) => {
    setSubmitErrors(null)

    const { error: loginError } = await api.post('/auth/reset-password', { ...values })

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
          <h2 className="text-lg font-medium text-gray-900 mb-16 text-center">Reset Password</h2>
          <form noValidate={true} onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="mb-5">
              <PasswordInput
                id="password"
                label="Enter new password"
                error={errors.password || submitErrors?.password}
                {...register('password')}
              />
            </div>
            <div>
              <PasswordInput
                id="password-confirm"
                label="Enter new password again"
                error={errors.passwordConfirm || submitErrors?.passwordConfirm}
                {...register('passwordConfirm')}
              />
            </div>
            <div>
              <input type="hidden" id="token" value={token} {...register('token')} />
            </div>
            <div className="flex flex-row mt-16">
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
          <div className="flex items-center flex-col pt-10">
            <div className="bg-green-100 p-3 rounded-full inline-flex items-center justify-center mb-3">
              <CheckIcon width={24} className="text-green-600" />
            </div>

            <h2 className="text-gray-900 text-lg font-medium mb-2">Password has been reset</h2>
            <p className="text-gray-500 text-sm text-center mb-6">Please use your new password when you login next time</p>
            <div className="w-full">
              <Button variant="primary" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}

export default ResetPasswordModal

import { AlertIcon } from 'components/Layout/Alerts'
import { Button } from 'components/Shared/Button'
import { Modal } from 'components/Shared/Modal'
import { api } from 'lib/api'
import { useState } from 'react'

interface ResendVerificationModalProps {
  openModal: boolean
  onModalClosed: () => void
  setSubmitErrors: (errors: any) => void
  errorMessage?: string
  email: string
}

export const ResendVerificationModal = ({
  openModal,
  onModalClosed,
  setSubmitErrors,
  errorMessage,
  email,
}: ResendVerificationModalProps) => {
  const [isResendLoading, setIsResendLoading] = useState(false)

  const handleResendEmailVerification = async () => {
    setIsResendLoading(true)
    const { error: resendError } = await api.post('/auth/send-email-verification', { email })

    if (resendError) {
      setSubmitErrors(resendError.errors)
      setIsResendLoading(false)
      return
    }
    setIsResendLoading(false)
  }

  return (
    <Modal open={openModal} onModalClosed={onModalClosed}>
      <>
        <div className="flex justify-center items-center pb-2">
          <AlertIcon type={'success'} />
        </div>
        <div className="flex items-center justify-center"></div>
        <h1 className="my-2 font-medium text-lg leading-6 text-center">Please check your email</h1>
        <div className="text-sm leading-5 text-gray-500">
          <p className="text-gray-500 text-sm text-center mb-8">
            We just sent an activation email to <span className="text-green-700 block">{email},</span>
            please check your inbox.
          </p>
          {errorMessage && <p className="text-red-600 text-center text-sm mt-4">{errorMessage}</p>}
          <span className="flex justify-center w-full">
            <Button
              className="max-w-xs w-full"
              onClick={handleResendEmailVerification}
              loading={isResendLoading}
              disabled={isResendLoading}
            >
              Resend
            </Button>
          </span>
        </div>
      </>
    </Modal>
  )
}

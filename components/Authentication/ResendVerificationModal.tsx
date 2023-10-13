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
      <div className="h-96 flex flex-col justify-center space-y-8">
        {errorMessage && <p className="text-center font-bold text-xl text-red-500">Error: {errorMessage}</p>}
        <p className="text-center font-bold text-xl">
          We just sent an activation email to <span className="text-indigo-500 block">{email},</span>
          please check your inbox.
        </p>
        <div className="w-full flex justify-center items-center space-x-4">
          <span className="font-bold"> {`Didn't get a email?`}</span>{' '}
          <div className="flex-0">
            <Button onClick={handleResendEmailVerification} loading={isResendLoading} disabled={isResendLoading}>
              Resend
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

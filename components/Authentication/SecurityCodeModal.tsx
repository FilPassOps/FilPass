import { Modal } from 'components/shared/Modal'
import { Button } from 'components/shared/Button'
import ReactInputVerificationCode from 'react-input-verification-code'
import { classNames } from 'lib/classNames'
import { useState } from 'react'
import CountDownTimer from '@inlightmedia/react-countdown-timer'
import { DateTime } from 'luxon'
import styles from './securityCodeModal.module.css'

interface SecurityCodeModalProps {
  open?: boolean
  onClose: (open: boolean) => void
  email?: string
  handleVerifyCode: (value: string) => Promise<{ error: any }>
  onResend: () => Promise<{ error: any }>
}

export const SecurityCodeModal = ({
  open = false,
  onClose,
  email = 'email@email.com',
  handleVerifyCode,
  onResend,
}: SecurityCodeModalProps) => {
  const [submitErrors, setSubmitErrors] = useState<any>()
  const [loading, setLoading] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const handleClose = () => {
    setSubmitErrors(null)
    setLoading(false)
    onClose(false)
  }

  const handleComplete = async (value: string) => {
    const { error } = await handleVerifyCode(value)

    if (error) {
      return setSubmitErrors(error.message)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    const { error } = await onResend()
    if (error) {
      setLoading(false)
      return setSubmitErrors(error.message)
    }
    blockedTimer()
    setSubmitErrors(null)
    setLoading(false)
  }

  const blockedTimer = () => {
    setBlocked(true)
    setTimeout(() => setBlocked(false), 60000)
  }

  return (
    <Modal open={open} onModalClosed={handleClose}>
      <h2 className="text-lg font-medium text-gray-900 mb-6 text-center">Enter 4-digit security code</h2>
      <p className="mb-8 text-sm text-gray-500 text-center">
        Please enter a 4-digit security code that was sent to you email address <span className="text-indigo-600">{email}.</span> The code
        is valid for 10 minutes
      </p>
      <div className={classNames('flex flex-row items-center justify-center', styles.customVerificationInput)}>
        <ReactInputVerificationCode autoFocus={true} placeholder={''} type="text" onCompleted={handleComplete} />
      </div>
      <p className="text-center text-sm text-red-500 mt-3">{submitErrors}</p>
      <div className="flex flex-row items-center justify-center mt-8 pb-4">
        <p className="mr-3 text-sm text-gray-500">Didn&apos;t get an email?</p>
        <div className="w-32 relative">
          <Button variant="primary" type="button" onClick={handleResend} loading={loading} disabled={loading || blocked}>
            Resend
          </Button>
          {blocked && (
            <div className="absolute -bottom-5 left-1/4 right-1/4 transform">
              <CountDownTimer
                dateTime={DateTime.now().plus(60000).toISO()}
                style={{
                  color: '#000000',
                  fontSize: '14px',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

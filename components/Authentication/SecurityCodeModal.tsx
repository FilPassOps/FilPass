import { Modal } from 'components/shared/Modal'
import { Button } from 'components/shared/Button'
import { useState } from 'react'
import { DateTime } from 'luxon'
import CountDownTimer from './CountDownTimer'
import OtpInput from 'react-otp-input'

interface SecurityCodeModalProps {
  open?: boolean
  onClose: (open: boolean) => void
  email?: string
  handleVerifyCode: (value: string) => Promise<{ error: any }> | Promise<Record<string, never>>
  onResend: () => Promise<{ error: any }>
}

const BLOCKED_TIMER_MS = 60000

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
  const [code, setCode] = useState('')

  const handleClose = () => {
    setSubmitErrors(null)
    setLoading(false)
    onClose(false)
    setBlocked(false)
    setCode('')
  }

  const handleComplete = async (value: string) => {
    const { error } = await handleVerifyCode(value)

    if (error) {
      return setSubmitErrors(error.message)
    }
  }

  const handleOnChangeCode = (value: string) => {
    setSubmitErrors(null)
    if (value.length === 4) {
      handleComplete(value)
    }
    setCode(value)
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
    setTimeout(() => setBlocked(false), BLOCKED_TIMER_MS)
  }

  return (
    <Modal open={open} onModalClosed={handleClose}>
      <h2 className="text-lg font-medium text-gray-900 mb-6 text-center">Enter 4-digit security code</h2>
      <p className="mb-8 text-sm text-gray-500 text-center">
        Please enter a 4-digit security code that was sent to you email address <span className="text-indigo-600">{email}.</span> The code
        is valid for 10 minutes
      </p>
      <OtpInput
        shouldAutoFocus={true}
        inputType="number"
        containerStyle={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}
        inputStyle={{ width: '3rem', height: '3rem', borderRadius: '0.375rem', border: '1px solid #D1D5DB', fontSize: '2rem' }}
        value={code}
        onChange={handleOnChangeCode}
        numInputs={4}
        renderInput={props => <input {...props} />}
      />
      <p className="text-center text-sm text-red-500 mt-3">{submitErrors}</p>
      <div className="flex flex-row items-center justify-center mt-8 pb-4">
        <p className="mr-3 text-sm text-gray-500">Didn&apos;t get an email?</p>
        <div className="w-32 relative">
          <Button variant="primary" type="button" onClick={handleResend} loading={loading} disabled={loading || blocked}>
            Resend
          </Button>
          {blocked && (
            <CountDownTimer className="flex items-end justify-end" deadline={DateTime.now().plus(BLOCKED_TIMER_MS).toISO() as string} />
          )}
        </div>
      </div>
    </Modal>
  )
}

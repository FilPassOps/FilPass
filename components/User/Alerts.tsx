import { Button } from 'components/Shared/Button'
import { useState } from 'react'

interface ErrorAlertProps {
  handleClose: () => void
  message?: string
  reason?: string
}

export const ErrorAlert: React.FC<React.PropsWithChildren<ErrorAlertProps>> = ({
  message = 'We are having problems sending your transaction. Please try again.',
  reason,
  handleClose,
  children,
}) => {
  const [toggleReason, setToggleReason] = useState(false)

  return (
    <div className="flex flex-col items-center">
      {children ?? (
        <>
          <p className="text-sm text-gray-600 text-center first-letter:uppercase">{message}</p>
          {reason && (
            <button className="text-sm text-green-700 font-medium" onClick={() => setToggleReason(!toggleReason)}>
              {toggleReason ? 'Hide Reason' : 'Show Reason'}
            </button>
          )}
        </>
      )}

      {toggleReason && <p className="text-sm text-gray-500">{reason}</p>}
      <Button className="w-36 mt-7" onClick={() => handleClose()}>
        Close
      </Button>
    </div>
  )
}

export const SuccessWithExplorerAlert: React.FC<React.PropsWithChildren<{ hash: string; handleClose: () => void; blockExplorerUrl: string }>> = ({
  hash,
  handleClose,
  blockExplorerUrl,
}) => (
  <>
    <p className="text-sm text-gray-500 mb-4 text-center">Your payment has been successfully sent and is being processed.</p>
    <div className="mt-4 text-sm text-gray-500 text-center mb-4">
      <a
        href={`${blockExplorerUrl}/${hash}`}
        onClick={() => handleClose()}
        rel="noreferrer"
        target="_blank"
        className="underline text-green-700"
      >
        Check the message
      </a>
    </div>
  </>
)

export const SuccessTransactionAlert: React.FC<React.PropsWithChildren<{ handleClose: () => void; transactionType: string }>> = ({
  handleClose,
  transactionType,
}) => (
  <div className="flex flex-col items-center">
    <p className="text-sm text-gray-500 text-center">Your {transactionType} Transaction has been successfully sent and is being processed.</p>
    <div className="mt-4 text-sm text-gray-500 text-center mb-4">
      <Button className="w-36 mt-4" onClick={() => handleClose()}>
        Close
      </Button>
    </div>
  </div>
)

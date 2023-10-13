import { Button } from 'components/Shared-tmp/Button'

interface NotificationStepProps {
  onCloseClick: () => void
  address: string
}

export const NotificationStep = ({ onCloseClick, address }: NotificationStepProps) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center space-y-10">
      <p className="font-medium text-lg text-gray-900 text-center">Verify wallet address</p>
      <div>
        <p className="text-sm leading-5 text-gray-500 text-center mt-2">
          We have sent you an email to your email address. <span className="text-indigo-600 font-bold">{address}</span>
        </p>
        <p className="text-sm leading-5 text-gray-500 text-center mt-2">
          Please click the verification link in the email to connect your wallet. The link will expire in 48 hours.
        </p>
      </div>
      <div className="flex w-full">
        <Button variant="primary" onClick={onCloseClick}>
          Close
        </Button>
      </div>
    </div>
  )
}

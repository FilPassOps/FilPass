import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

export const IsVerified = ({ isVerified, showText = true }) => {
  if (isVerified) {
    return (
      <div className="flex items-center text-sm text-gray-900">
        <CheckCircleIcon className="mr-2 w-4 h-4 shrink-0 text-green-500" />
        {showText && 'Verified'}
      </div>
    )
  }

  return (
    <div className="flex items-center text-sm text-gray-900">
      <XCircleIcon className="mr-2 w-4 h-4 shrink-0 text-gray-500" />
      {showText && 'Not Verified'}
    </div>
  )
}

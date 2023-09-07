import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'

interface ReturnStatusModalProps {
  handleClose: () => void
  success: boolean
  title?: string
  description?: string
  isOpen: boolean
}

interface SuccessContentProps {
  handleClose: () => void
  title: string
  description: string
}

interface ErrorContentProps {
  handleClose: () => void
  title: string
  description: string
}

export function ReturnStatusModal({
  handleClose,
  success,
  title = 'Modal title',
  description = 'Modal description',
  isOpen,
}: ReturnStatusModalProps) {
  return (
    <Modal open={isOpen} onModalClosed={handleClose} className="py-4 rounded w-3/6">
      <>
        {success && <SuccessContent handleClose={handleClose} title={title} description={description} />}
        {!success && <ErrorContent handleClose={handleClose} title={title} description={description} />}
      </>
    </Modal>
  )
}

function SuccessContent({ handleClose, title, description }: SuccessContentProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="h-12 w-12 flex justify-center items-center rounded-full bg-green-100 mt-3">
        <CheckIcon className="h-6 w-6 text-green-600" />
      </div>
      <div className="mt-3">
        <p className="font-medium text-lg text-gray-900 text-center">{title}</p>
      </div>
      <p className="text-sm leading-5 text-gray-500 text-center w-4/6 mt-2">{description}</p>
      <div className="w-max mt-4">
        <Button onClick={handleClose}>Close</Button>
      </div>
    </div>
  )
}

function ErrorContent({ handleClose, title, description }: ErrorContentProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="h-12 w-12 flex justify-center items-center rounded-full bg-red-100 mt-3">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
      </div>
      <div className="mt-3">
        <p className="font-medium text-lg text-gray-900 text-center">{title}</p>
      </div>
      <p className="text-sm leading-5 text-gray-500 text-center w-4/6 mt-2">{description}</p>
      <div className="w-max mt-4">
        <Button onClick={handleClose}>Close</Button>
      </div>
    </div>
  )
}

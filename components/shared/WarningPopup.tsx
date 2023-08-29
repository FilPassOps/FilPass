import { Modal } from 'components/shared/Modal'
import { Button } from 'components/shared/Button'

interface WarningPopupProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  title?: string
  message?: string
}

export const WarningPopup = ({ isOpen, setIsOpen, title = 'title', message = 'This is the popup message' }: WarningPopupProps) => {
  return (
    <Modal open={isOpen} onModalClosed={() => setIsOpen(false)}>
      <h2 className="text-gray-900 text-lg text-center font-medium mb-9">{title}</h2>
      <p className="text-gray-500 text-sm mb-9 text-center">{message}</p>
      <div className="flex space-x-3">
        <Button variant="primary" onClick={() => setIsOpen(false)}>
          Close
        </Button>
      </div>
    </Modal>
  )
}

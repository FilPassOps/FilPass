import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'

interface ViewReasonModalProps {
  reason?: string
  open: boolean
  onModalClosed: () => void
  trustedDangerousHtml?: boolean
}

export const ViewReasonModal = ({ reason, open, onModalClosed, trustedDangerousHtml = false }: ViewReasonModalProps) => {
  const closeModal = () => {
    onModalClosed()
  }

  return (
    <Modal open={open} onModalClosed={closeModal}>
      <div className="space-y-4">
        <h2 className="text-gray-900 text-lg font-medium text-left">Reason</h2>
        {trustedDangerousHtml ? (
          <p dangerouslySetInnerHTML={{ __html: reason ?? '-' }} className="text-gray-500 text-sm whitespace-pre-line" />
        ) : (
          <p className="text-gray-500 text-sm whitespace-pre-line">{reason ?? '-'}</p>
        )}
        <div className="flex items-end justify-end">
          <Button className="w-24" onClick={closeModal}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

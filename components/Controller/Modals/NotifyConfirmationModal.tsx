import { Button } from 'components/Shared/Button'
import { Modal } from 'components/Shared/Modal'
import { api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface NotifyConfirmationModalProps {
  data: {
    publicId: string
  }[]
  open: boolean
  onClose: () => void
}

const NotifyConfirmationModal = ({ data = [], open, onClose }: NotifyConfirmationModalProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirmation = async () => {
    setIsSubmitting(true)
    const requestBody = { publicIds: data.map(({ publicId }) => publicId) }
    await api.post('/notify/payment', requestBody)
    onClose()
    setIsSubmitting(false)
    router.push(router.asPath)
  }

  return (
    <Modal open={open} onModalClosed={onClose}>
      <h2 className="text-gray-900 text-lg text-center font-medium mb-16">Notify Receiver</h2>
      <p className="text-sm text-gray-500 mb-16 text-center">Are you sure you want to send notification email to receivers?</p>
      <div className="flex space-x-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleConfirmation} disabled={isSubmitting} loading={isSubmitting}>
          Yes
        </Button>
      </div>
    </Modal>
  )
}

export default NotifyConfirmationModal

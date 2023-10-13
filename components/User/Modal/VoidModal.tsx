import { Button } from 'components/Shared/Button'
import { Modal } from 'components/Shared/Modal'
import { api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface VoidModalProps {
  onModalClosed: () => void
  open: boolean
  data: any
}

export const VoidModal = ({ onModalClosed, open, data }: VoidModalProps) => {
  const { reload } = useRouter()
  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(false)

  const handleVoid = async () => {
    setIsLoading(true)
    const { error } = await api.post(`/transfer-requests/${data.id}/void`)

    if (error) {
      setError(error?.message || error?.errors)
      return
    }
    setIsLoading(false)
    onModalClosed()
    reload()
  }

  return (
    <Modal open={open} onModalClosed={onModalClosed}>
      <div className="space-y-9 text-center">
        <h2 className="text-gray-900 text-lg font-medium">Void transfer request</h2>
        <p className="text-gray-500 text-sm">Are you sure you want to void the transfer request?</p>
        {error && <p className="text-red-600 text-center text-sm mt-4">{errorsMessages.error_voiding_transfer_request.message}</p>}

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onModalClosed}>
            Cancel
          </Button>
          <Button onClick={handleVoid} disabled={isLoading} loading={isLoading}>
            Yes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

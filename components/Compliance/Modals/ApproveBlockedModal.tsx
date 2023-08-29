import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface ApproveBlockedModalProps {
  userId: number
  open: boolean
  onModalClosed: () => void
}

export const ApproveBlockedModal = ({ userId, open, onModalClosed }: ApproveBlockedModalProps) => {
  const router = useRouter()

  const [error, setError] = useState<any>()
  const [isLoading, setIsLoading] = useState(false)

  const closeModal = () => {
    if (isLoading) {
      // force reloading the page to make sure it stops the pending requests
      return window.location.reload()
    }
    onModalClosed()
  }

  const handleApprove = async () => {
    setIsLoading(true)
    const { error } = await api.post(`/users/${userId}/sanction-review/unblock`)
    if (error) {
      setError(error)
      return
    }
    setIsLoading(false)
    closeModal()
    router.reload()
  }

  return (
    <Modal open={open} onModalClosed={closeModal}>
      <div className="space-y-9 text-center">
        <h2 className="text-gray-900 text-lg font-medium">Unblock flagged user</h2>
        <p className="text-gray-500 text-sm">Are you sure you want to unblock the user?</p>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isLoading} loading={isLoading}>
            Unblock
          </Button>
        </div>
      </div>
    </Modal>
  )
}

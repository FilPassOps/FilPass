import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface RejectBlockedModalProps {
  userId: string
  open: boolean
  onModalClosed: () => void
}

export const RejectBlockedModal = ({ userId, open, onModalClosed }: RejectBlockedModalProps) => {
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

  const handleReject = async () => {
    setIsLoading(true)
    const { error } = await api.post(`/users/${userId}/sanction-review/block`)
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
        <h2 className="text-gray-900 text-lg font-medium">Block flagged user</h2>
        <p className="text-gray-500 text-sm">
          All of this user&apos;s requests will be rejected and this can’t be undone. Are you sure you want to block this user?
        </p>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleReject} disabled={isLoading} loading={isLoading}>
            Block
          </Button>
        </div>
      </div>
    </Modal>
  )
}

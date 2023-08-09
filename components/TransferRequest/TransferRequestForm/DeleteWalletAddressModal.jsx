import { useAuth } from 'components/Authentication/Provider'
import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { api } from 'lib/api'
import { useState } from 'react'

export const DeleteWalletAddressModal = ({ openModal, onModalClosed, wallet }) => {
  const { refresh } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState()

  const handleDelete = async () => {
    setLoading(true)
    const { error } = await api.delete(`/wallets/${wallet.id}`)
    setLoading(false)

    if (error) {
      setError(error.errors || error.message)
      return
    }

    refresh()
    onModalClosed()
  }

  const handleModalClose = () => {
    onModalClosed()
    setTimeout(setError, 300)
  }

  return (
    <Modal open={openModal} onModalClosed={handleModalClose}>
      <div className="space-y-9">
        <h2 className="font-medium text-lg text-center">Delete address</h2>
        <div>
          <p className="text-gray-500 text-sm text-center break-all">
            Are you sure you want to delete “{wallet?.name || wallet?.address}”?
          </p>
          {error && (
            <p
              className="text-red-600 text-center text-sm mt-4"
              dangerouslySetInnerHTML={{ __html: error }}
            />
          )}
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button onClick={handleDelete} loading={loading} disabled={loading}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}

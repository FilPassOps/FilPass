import { useAuth } from 'components/Authentication/Provider'
import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { api } from 'lib/api'
import { useState } from 'react'

export const DeleteFileModal = ({ openModal, onModalClosed, file, onDelete = () => {}, uploadingForOthers = false }) => {
  const { refresh } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState()

  const apiCall = async () => {
    if (uploadingForOthers) {
      return await api.delete(`/files/temporary/${file.publicId}`)
    }

    return await api.delete(`/files/${file.publicId}`)
  }
  const handleDelete = async () => {
    setLoading(true)
    const { error } = await apiCall()
    setLoading(false)

    if (error) {
      setError(error.errors || error.message)
      return
    }

    refresh()
    onDelete()
    onModalClosed()
  }
  const handleModalClose = () => {
    onModalClosed()
    setError('')
  }
  return (
    <Modal open={openModal} onModalClosed={handleModalClose}>
      <div className="space-y-9">
        <h2 className="font-medium text-lg text-center">Delete file</h2>
        <div>
          <p className="text-gray-500 text-sm text-center">Are you sure you want to delete “{file?.filename}”?</p>
          {error && <p className="text-red-600 text-center text-sm mt-4" dangerouslySetInnerHTML={{ __html: error }} />}
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onModalClosed}>
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

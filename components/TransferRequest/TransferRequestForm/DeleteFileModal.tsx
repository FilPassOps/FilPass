import { useAuth } from 'components/Authentication/Provider'
import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { FilecoinApiResult } from 'domain/utils/sendFILWithMaster'
import { api } from 'lib/api'
import { useState } from 'react'

interface DeleteFileModalProps {
  openModal: boolean
  onModalClosed: () => void
  file: any
  onDelete?: () => void
  uploadingForOthers?: boolean
}

export const DeleteFileModal = ({
  openModal,
  onModalClosed,
  file,
  onDelete = () => {},
  uploadingForOthers = false,
}: DeleteFileModalProps) => {
  const { refresh } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>()

  const apiCall = async () => {
    if (uploadingForOthers) {
      return await api.delete(`/files/temporary/${file.publicId}`) as FilecoinApiResult
    }

    return await api.delete(`/files/${file.publicId}`) as FilecoinApiResult
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

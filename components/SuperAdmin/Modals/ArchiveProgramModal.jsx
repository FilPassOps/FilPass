import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { api } from 'lib/api'
import { useState } from 'react'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { useRouter } from 'next/router'
import { ACTIVE_STATUS, ARCHIVED_STATUS } from 'domain/programs/constants'

export const ArchiveProgramModal = ({ onModalClosed, open, program, isActive }) => {
  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const { push } = useRouter()

  const handleArchiveProgram = async () => {
    setIsLoading(true)

    const actionHandler = isActive ? api.delete : api.patch

    const { error } = await actionHandler(`/programs/${program.id}?unarchive=${isActive}`)

    if (error) {
      setError(error?.message || error?.errors)
      return
    }
    setIsLoading(false)
    onModalClosed()
    const query =  isActive ? `status=${ARCHIVED_STATUS}` : `status=${ACTIVE_STATUS}`
    push(`?${query}`)
  }

  return (
    <Modal open={open} onModalClosed={onModalClosed}>
      <div className="space-y-9 text-center">
        <h2 className="text-gray-900 text-lg font-medium">{isActive ? 'Archive' : 'Unarchive'} Program</h2>
        <p className="text-gray-500 text-sm">
          Are you sure you want to {isActive ? 'archive' : 'unarchive'} program ”{program?.program_name}”?
        </p>
        {error && (
          <p className="text-red-600 text-center text-sm mt-4">
            {errorsMessages.error_archiving_program.message}
          </p>
        )}

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onModalClosed}>
            Cancel
          </Button>
          <Button onClick={handleArchiveProgram} disabled={isLoading} loading={isLoading}>
            Yes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

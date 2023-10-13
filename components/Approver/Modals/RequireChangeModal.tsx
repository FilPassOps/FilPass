import { Button } from 'components/Shared/Button'
import { TextArea } from 'components/Shared/FormInput'
import { Modal } from 'components/Shared/Modal'
import { REQUIRES_CHANGES_STATUS } from 'domain/transfer-request/constants'
import { api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form'

interface RequireChangeProps {
  data: {
    id: string
  }
  open: boolean
  onModalClosed: () => void
}

export const RequireChangeModal = ({ data, open, onModalClosed }: RequireChangeProps) => {
  const { push } = useRouter()
  const [error, setError] = useState<any>()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const handleReject = async ({ notes }: { notes: string }) => {
    const { error } = await api.post('/transfer-requests-review', {
      notes,
      status: REQUIRES_CHANGES_STATUS,
      transferRequestId: data.id,
    })
    if (error) {
      setError(error)
      return
    }
    onModalClosed()
    push('/approvals')
  }

  const handleModalClosed = () => {
    onModalClosed()
    setTimeout(reset, 300)
  }

  return (
    <Modal open={open} onModalClosed={handleModalClosed}>
      <form onSubmit={handleSubmit(handleReject as SubmitHandler<FieldValues>)} className="space-y-6">
        <h2 className="text-gray-900 text-lg text-center font-medium">Request Modification</h2>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        <TextArea label="Reason for change" error={error?.errors?.notes || errors?.notes} {...register('notes', { required: true })} />
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleModalClosed}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  )
}

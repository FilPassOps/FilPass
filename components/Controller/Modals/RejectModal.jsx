import { Button } from 'components/shared/Button'
import { TextArea } from 'components/shared/FormInput'
import { Modal } from 'components/shared/Modal'
import { api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

const RejectModal = ({ data, open, onModalClosed }) => {
  const router = useRouter()
  const [error, setError] = useState()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const handleReject = async ({ notes }) => {
    const { error } = await api.post('/transfers/reject', {
      notes,
      transferRequestId: data,
    })
    if (error) {
      setError(error)
      return
    }
    onModalClosed()
    router.push(router.asPath)
  }

  const handleModalClosed = () => {
    onModalClosed()
    setTimeout(reset, 300)
  }

  return (
    <Modal open={open} onModalClosed={handleModalClosed}>
      <form onSubmit={handleSubmit(handleReject)} className="space-y-6">
        <h2 className="text-gray-900 text-lg text-center font-medium">
          Reject the Transfer Request
        </h2>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        <TextArea
          label="Reason for rejection"
          error={error?.errors?.notes || errors?.notes}
          {...register('notes', { required: true })}
        />

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


export default RejectModal

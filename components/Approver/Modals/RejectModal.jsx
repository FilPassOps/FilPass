import { Button } from 'components/shared/Button'
import { TextArea } from 'components/shared/FormInput'
import { Modal } from 'components/shared/Modal'
import { BLOCKED_STATUS, REJECTED_BY_APPROVER_STATUS } from 'domain/transferRequest/constants'
import { api } from 'lib/api'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'

export const RejectModal = ({ data, open, onModalClosed, isBatch = false }) => {
  const { push } = useRouter()
  const [error, setError] = useState()
  const { cache } = useSWRConfig()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const handleReject = async ({ notes }) => {
    if (isBatch) {
      const requests = data.map(request => request.id)
      const { error } = await api.post('/transfer-requests-review/reject', { requests, notes })

      if (error) {
        if (error.errors) {
          return setError(error?.errors.requests)
        }
        return setError(error)
      }
      cache.clear()
      onModalClosed()
      return push('/approvals')
    }
    const { error } = await api.post('/transfer-requests-review', {
      notes,
      status: REJECTED_BY_APPROVER_STATUS,
      transferRequestId: data.id,
    })
    if (error) {
      return setError(error)
    }

    const goBackRoute = data.status === BLOCKED_STATUS ? '/approvals?status=ON_HOLD' : '/approvals?status=SUBMITTED'

    cache.clear()
    onModalClosed()
    return push(goBackRoute)
  }

  const handleModalClosed = () => {
    onModalClosed()
    setTimeout(reset, 300)
  }

  const warningText = () => {
    if (Array.isArray(data)) {
      return data.map(({ id }, index) => (
        <Fragment key={id}>
          {index > 0 && ', '}
          <Link
            key={id}
            href={`/approvals/${id}`}
            passHref={true}
            className="text-sky-700 underline"
            target="_blank">
            #{id}

          </Link>
        </Fragment>
      ));
    }

    return null
  }

  return (
    <Modal open={open} onModalClosed={handleModalClosed}>
      <form onSubmit={handleSubmit(handleReject)} className="space-y-6">
        <h2 className="text-gray-900 text-lg text-center font-medium">Reject the Transfer Request</h2>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        <div className="text-center">{warningText()}</div>
        <TextArea label="Reason for rejection" error={error?.errors?.notes || errors?.notes} {...register('notes', { required: true })} />
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

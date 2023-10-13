import { Button } from 'components/Shared/Button'
import { TextArea } from 'components/Shared/FormInput'
import { Modal } from 'components/Shared/Modal'
import { REJECTED_BY_APPROVER_STATUS } from 'domain/transfer-request/constants'
import { api } from 'lib/api'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useState } from 'react'
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form'

interface RequestListProps {
  data:
    | {
        id: string
        status: string
      }
    | {
        id: string
        status: string
      }[]
  open: boolean
  onModalClosed: () => void
  isBatch?: boolean
}

interface HandleRejectProps {
  notes: string
}

export const RejectModal = ({ data, open, onModalClosed, isBatch = false }: RequestListProps) => {
  const { push } = useRouter()
  const [error, setError] = useState<string | { message: string; errors: { notes: string } }>()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const handleReject = async ({ notes }: HandleRejectProps) => {
    if (isBatch) {
      const requests = Array.isArray(data) ? data.map(request => request.id) : null
      const { error }: { error: string | { message: string; errors: { notes: string; requests: string } } } = await api.post(
        '/transfer-requests-review/reject',
        { requests, notes },
      )

      if (error) {
        if (typeof error === 'object' && error.errors) {
          return setError(error?.errors.requests)
        }
        return setError(error)
      }
      onModalClosed()
      return push('/approvals')
    }
    const { error }: { error: string | { message: string; errors: { notes: string; requests: string } } } = await api.post(
      '/transfer-requests-review',
      {
        notes,
        status: REJECTED_BY_APPROVER_STATUS,
        transferRequestId: !Array.isArray(data) ? data.id : null,
      },
    )
    if (error) {
      return setError(error)
    }

    const goBackRoute = !Array.isArray(data) ? '/approvals?status=SUBMITTED' : '/approvals'

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
          <Link key={id} href={`/approvals/${id}`} passHref={true} className="text-sky-700 underline" target="_blank">
            #{id}
          </Link>
        </Fragment>
      ))
    }

    return null
  }

  return (
    <Modal open={open} onModalClosed={handleModalClosed}>
      <form onSubmit={handleSubmit(handleReject as SubmitHandler<FieldValues>)} className="space-y-6">
        <h2 className="text-gray-900 text-lg text-center font-medium">Reject the Transfer Request</h2>
        {typeof error === 'object' && error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        <div className="text-center">{warningText()}</div>
        <TextArea
          label="Reason for rejection"
          error={(typeof error === 'object' && error?.errors?.notes) || errors?.notes}
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

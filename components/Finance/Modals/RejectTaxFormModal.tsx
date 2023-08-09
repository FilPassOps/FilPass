import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'components/shared/Button'
import { TextArea } from 'components/shared/FormInput'
import { Modal } from 'components/shared/Modal'
import { api } from 'lib/api'
import yup from 'lib/yup'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'

interface ApiResult {
  error: { message: string }
}

interface FormValues {
  rejectionReason: string
}

interface RejectTaxFormModalProps {
  taxForms: {
    id: number
    email: string
  }[]
  open: boolean
  onModalClosed: () => void
}

export const RejectTaxFormModal = ({ taxForms, open, onModalClosed }: RejectTaxFormModalProps) => {
  const swrConfig = useSWRConfig()
  const cache = swrConfig.cache as any
  const router = useRouter()

  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(yup.object({ rejectionReason: yup.string().trim().required() }).required()),
  })

  const closeModal = () => {
    cache.clear()
    onModalClosed()
    setTimeout(reset, 300)
  }

  const handleReject = async ({ rejectionReason }: FormValues) => {
    const { data } = await api.post<ApiResult>('/files/reject', { rejectionReason, taxFormIds: taxForms.map(taxForm => taxForm.id) })
    if (data.error) {
      setError(data.error.message)
      return
    }
    closeModal()
    router.reload()
  }

  return (
    <Modal open={open} onModalClosed={closeModal}>
      <form onSubmit={handleSubmit(handleReject)} className="space-y-6">
        <div className="flex flex-col gap-8 text-center">
          <h2 className="text-gray-900 text-lg font-medium">Reject tax document</h2>
          <p className="text-sm font-medium leading-5 text-gray-700">
            {`Are you sure you want to reject the selected tax document${taxForms.length > 1 ? 's' : ''}?`}
          </p>
          <ul className="text-gray-500 text-sm">
            {taxForms.map(item => (
              <li key={item.id} className="">
                {item.email}
              </li>
            ))}
          </ul>
          {error && <p className="text-red-600 text-center text-sm mt-4">{error}</p>}
          <TextArea
            // @ts-ignore
            label="Reason for rejection"
            error={error || errors?.rejectionReason}
            {...register('rejectionReason')}
          />
          <div className="flex space-x-3">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            {/* @ts-ignore */}
            <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
              Submit
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

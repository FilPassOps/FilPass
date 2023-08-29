import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useSWRConfig } from 'swr'

interface ApiResult {
  error: { message: string }
}

interface ApproveTaxFormModalProps {
  taxForms: {
    id: number
    email: string
  }[]
  open: boolean
  onModalClosed: () => void
}

export const ApproveTaxFormModal = ({ taxForms, open, onModalClosed }: ApproveTaxFormModalProps) => {
  const swrConfig = useSWRConfig()
  const cache = swrConfig.cache as any
  const router = useRouter()

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const closeModal = () => {
    if (isLoading) {
      // force reloading the page to make sure it stops the pending requests
      return window.location.reload()
    }
    cache.clear()
    onModalClosed()
  }

  const handleApprove = async () => {
    setIsLoading(true)
    const { data } = await api.post<ApiResult>('/files/approve', { taxFormIds: taxForms.map(taxForm => taxForm.id) })
    if (data?.error) {
      setError(data.error?.message)
      return
    }
    setIsLoading(false)
    closeModal()
    router.reload()
  }

  return (
    <Modal open={open} onModalClosed={closeModal}>
      <div className="space-y-9 text-center">
        <h2 className="text-gray-900 text-lg font-medium">Approve tax document</h2>
        <p className="text-gray-500 text-sm">
          {`Are you sure you want to approve the selected tax document${taxForms.length > 1 ? 's' : ''}?`}
        </p>
        <ul className="text-gray-500 text-sm">
          {taxForms.map(item => (
            <li key={item.id} className="">
              {item.email}
            </li>
          ))}
        </ul>
        {error && <p className="text-red-600 text-center text-sm mt-4">{error}</p>}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isLoading} loading={isLoading}>
            Approve
          </Button>
        </div>
      </div>
    </Modal>
  )
}

import { Button } from 'components/Shared/Button'
import { Modal } from 'components/Shared/Modal'
import { SUBMITTED_STATUS } from 'domain/transfer-request/constants'
import { api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface WithdrawModalProps {
  data: {
    id: string
    history: {
      field: string
      old_value: string
    }[]
  }
  open: boolean
  text?: string
  onModalClosed: () => void
  withdrawTypeText?: string
}

export const WithdrawModal = ({ data, open, text: withdrawTypeText = '', onModalClosed }: WithdrawModalProps) => {
  const { reload } = useRouter()
  const [error, setError] = useState<any>()
  const [isLoading, setIsLoading] = useState(false)

  const handleApprove = async () => {
    setIsLoading(true)

    const lastStatusChange = data.history?.find(item => item.field === 'status')

    const { error } = await api.post('/transfer-requests-review', {
      status: lastStatusChange ? lastStatusChange.old_value : SUBMITTED_STATUS,
      transferRequestId: data.id,
    })

    setIsLoading(false)

    if (error) {
      return setError(error)
    }
    onModalClosed()
    reload()
  }

  return (
    <Modal open={open} onModalClosed={onModalClosed}>
      <div className="space-y-9 text-center">
        <h2 className="text-gray-900 text-lg font-medium">Withdraw {withdrawTypeText}</h2>
        <p className="text-gray-500 text-sm">
          Are you sure you want to withdraw {withdrawTypeText && withdrawTypeText.toLowerCase()} of this request?
        </p>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onModalClosed}>
            Cancel
          </Button>
          <Button variant='tertiary' onClick={handleApprove} disabled={isLoading} loading={isLoading}>
            Withdraw
          </Button>
        </div>
      </div>
    </Modal>
  )
}

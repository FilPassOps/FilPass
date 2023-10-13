import { Button } from 'components/Shared-tmp/Button'
import { Modal } from 'components/Shared-tmp/Modal'
import { APPROVED_STATUS, PROCESSING_STATUS } from 'domain/transfer-request/constants'
import { api } from 'lib/api'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface RequestListProps {
  requests: string[]
}

interface ApproveModalProps {
  data:
    | {
        id: string
      }[]
    | {
        id: string
      }
  open: boolean
  onModalClosed: () => void
  isBatch?: boolean
}

interface TransferRequestApproved {
  id: string
  publicId: string
}

interface TransferRequestFailed {
  id: string
  publicId: string
  error: string
}

interface TransferRequestReview {
  id: string
  approvedRequests: TransferRequestApproved[]
  failedRequests: TransferRequestFailed[]
}

export const ApproveModal = ({ data, open, onModalClosed, isBatch = false }: ApproveModalProps) => {
  const { push } = useRouter()

  const [error, setError] = useState<string | { message: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const [approvedRequests, setApprovedRequests] = useState<TransferRequestApproved[]>([])
  const [failedRequests, setFailedRequests] = useState<TransferRequestFailed[]>([])

  const [hasFinishedBatchApproval, setHasFinishedBatchApproval] = useState(false)

  const closeModal = () => {
    onModalClosed()
    if (hasFinishedBatchApproval && !error) {
      push('/approvals?status=APPROVED')
    }
  }

  const handleApprove = async () => {
    setIsLoading(true)
    if (isBatch && Array.isArray(data)) {
      const { data: result, error }: { data: TransferRequestReview; error: string } = await api.post('/transfer-requests-review/approve', {
        requests: data.map(({ id }) => id),
      })
      setIsLoading(false)
      if (error) {
        setError(error)
      } else {
        setApprovedRequests(result.approvedRequests)
        setFailedRequests(result.failedRequests)
      }
      return setHasFinishedBatchApproval(true)
    }

    const { error, data: result } = await api.post('/transfer-requests-review', {
      status: APPROVED_STATUS,
      transferRequestId: Array.isArray(data) ? null : data.id,
    })
    setIsLoading(false)
    if (error) {
      setError(error)
      return
    }
    closeModal()
    if (result.status === PROCESSING_STATUS) {
      push('/approvals?status=PROCESSING')
    } else {
      push('/approvals')
    }
  }

  return (
    <Modal open={open} onModalClosed={closeModal}>
      <div className="space-y-9 text-center">
        <h2 className="text-gray-900 text-lg font-medium">Approve Transfer Request</h2>
        {!hasFinishedBatchApproval && (
          <>
            <p className="text-gray-500 text-sm">Are you sure you want to approve the transfer request?</p>
            {Array.isArray(data) && <RequestList requests={data.map(({ id }) => id)} />}
          </>
        )}
        {hasFinishedBatchApproval && !error && (
          <div>
            {approvedRequests.length > 0 && <p className="text-green-500 text-lg py-2">The following requests were approved:</p>}
            {approvedRequests.length > 0 && <RequestList requests={approvedRequests.map(({ publicId }) => publicId)} />}
            {failedRequests.length > 0 && <p className="text-red-600 text-lg py-2">The following requests failed to approve:</p>}
            {failedRequests.length > 0 && <RequestList requests={failedRequests.map(({ publicId }) => publicId)} />}
          </div>
        )}
        {typeof error === 'object' && error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        <div className="flex space-x-3">
          {!hasFinishedBatchApproval && (
            <>
              <Button variant="outline" onClick={closeModal} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={isLoading} loading={isLoading}>
                Approve
              </Button>
            </>
          )}
          {hasFinishedBatchApproval && <Button onClick={closeModal}>Close</Button>}
        </div>
      </div>
    </Modal>
  )
}

const RequestList = ({ requests }: RequestListProps) => (
  <div>
    {requests.map((request, index) => (
      <span key={request}>
        <Link href={`/approvals/${request}`} passHref={true} className="text-sky-700 underline" target="_blank">
          #{request}
        </Link>
        {index === requests.length - 1 ? '' : `, `}
      </span>
    ))}
  </div>
)

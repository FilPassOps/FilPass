import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { APPROVED_STATUS, PROCESSING_STATUS } from 'domain/transferRequest/constants'
import { api } from 'lib/api'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useSWRConfig } from 'swr'

export const ApproveModal = ({ data, open, onModalClosed, isBatch = false }) => {
  const { push } = useRouter()
  const { cache } = useSWRConfig()

  const [error, setError] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const [approvedRequests, setApprovedRequests] = useState([])
  const [failedRequests, setFailedRequests] = useState([])

  const [hasFinishedBatchApproval, setHasFinishedBatchApproval] = useState(false)

  const closeModal = () => {
    cache.clear()
    onModalClosed()
    if (hasFinishedBatchApproval && !error) {
      push('/approvals?status=APPROVED')
    }
  }

  const handleApprove = async () => {
    setIsLoading(true)
    if (isBatch) {
      const { data: result, error } = await api.post('/transfer-requests-review/approve', { requests: data.map(({ id }) => id) })
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
      transferRequestId: data.id,
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
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
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

const RequestList = ({ requests }) => (
  <div>
    {requests.map((request, index) => (
      <span key={request}>
        <Link
          href={`/approvals/${request}`}
          passHref={true}
          className="text-sky-700 underline"
          target="_blank">
          #{request}

        </Link>
        {index === requests.length - 1 ? '' : `, `}
      </span>
    ))}
  </div>
)

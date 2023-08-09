import { useAuth } from 'components/Authentication/Provider'
import { Button, LinkButton } from 'components/shared/Button'
import { ViewTransferRequest } from 'components/TransferRequest/ViewTransferRequest'
import { SUBMITTED_BY_APPROVER_STATUS } from 'domain/transferRequest/constants'
import { useState } from 'react'
import { VoidModal } from './Modal/VoidModal'

export const TransferDetails = ({ data }) => {
  const [voidModalOpen, setVoidModalOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <ViewTransferRequest data={data} />
        <div className="flex justify-center space-x-3">
          <div>
            <LinkButton href="/my-transfer-requests" variant="outline">
              Back
            </LinkButton>
          </div>

          {data?.isVoidable && data?.status !== SUBMITTED_BY_APPROVER_STATUS && (
            <div>
              <Button variant="primary-lighter" onClick={() => setVoidModalOpen(true)}>
                Void
              </Button>
            </div>
          )}

          {data?.isEditable && (data?.applyer_id === user?.id || data?.status !== SUBMITTED_BY_APPROVER_STATUS) && (
            <div>
              <LinkButton href={`/transfer-requests/${data.id}/edit`}>Edit</LinkButton>
            </div>
          )}
        </div>
      </div>
      <VoidModal open={voidModalOpen} onModalClosed={() => setVoidModalOpen(false)} data={data} />
    </>
  )
}

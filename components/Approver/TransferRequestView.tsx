import { useAuth } from 'components/Authentication/Provider'
import { Button } from 'components/Shared-tmp/Button'
import { ViewTransferRequest } from 'components/TransferRequest/ViewTransferRequest'
import { APPROVER_ROLE } from 'domain/auth/constants'
import {
  APPROVED_STATUS,
  DRAFT_STATUS,
  PROCESSING_STATUS,
  REJECTED_BY_APPROVER_STATUS,
  REQUIRES_CHANGES_STATUS,
  SUBMITTED_BY_APPROVER_STATUS,
  SUBMITTED_STATUS,
} from 'domain/transfer-request/constants'
import { useState } from 'react'
import { TransferRequestViewProps } from 'components/Controller/TransferRequestView'
import dynamic from 'next/dynamic'

const ApproveModal = dynamic(() => import('./Modals/ApproveModal').then(mod => mod.ApproveModal))
const RejectModal = dynamic(() => import('./Modals/RejectModal').then(mod => mod.RejectModal))
const DeleteModal = dynamic(() => import('../TransferRequest/Shared-tmp/DeleteModal').then(mod => mod.DeleteModal))
const RequireChangeModal = dynamic(() => import('./Modals/RequireChangeModal').then(mod => mod.RequireChangeModal))
const WithdrawModal = dynamic(() => import('./Modals/WithdrawModal').then(mod => mod.WithdrawModal))

export const TransferRequestView = ({ data }: TransferRequestViewProps) => {
  const { user } = useAuth()
  const { approversGroup } = data

  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [requireChangeModalOpen, setRequireChangeModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawModalText, setWithdrawModalText] = useState('')

  const hasApproverRole = user?.roles.find(({ role }) => role === APPROVER_ROLE)
  const approvedByYou = approversGroup?.some(
    group => group.approved && group.members.some(member => member.userRoleId === hasApproverRole?.id),
  )

  const showApprovalOptions = data.status === SUBMITTED_STATUS || (data.status === PROCESSING_STATUS && !approvedByYou)
  const showApprove =
    [SUBMITTED_STATUS, SUBMITTED_BY_APPROVER_STATUS].includes(data.status) || (data.status === PROCESSING_STATUS && !approvedByYou)
  const showDeleteButton = data.status === DRAFT_STATUS || data.status === SUBMITTED_BY_APPROVER_STATUS

  const showWithdrawButton = (data.status === APPROVED_STATUS || (data.status === PROCESSING_STATUS && approvedByYou)) && hasApproverRole
  const showWithdrawRejectionButton = data.status === REJECTED_BY_APPROVER_STATUS && hasApproverRole
  const showRequiresChangeActions = data.status === REQUIRES_CHANGES_STATUS && hasApproverRole

  const openWithdrawModal = (text: string) => {
    setWithdrawModalOpen(true)
    setWithdrawModalText(text)
  }

  return (
    <>
      <ViewTransferRequest data={data} role={APPROVER_ROLE} />
      <div className="flex mt-6 space-x-3 max-w-max mx-auto">
        {showApprovalOptions && (
          <Button variant="outline" className="whitespace-nowrap" onClick={() => setRequireChangeModalOpen(true)}>
            Requires Change
          </Button>
        )}

        {(showApprovalOptions || showRequiresChangeActions) && (
          <Button className="flex-1" variant="primary-lighter" onClick={() => setRejectModalOpen(true)}>
            Reject
          </Button>
        )}

        {showApprove && <Button onClick={() => setApproveModalOpen(true)}>Approve</Button>}
        {showDeleteButton && (
          <Button variant="primary-lighter" onClick={() => setDeleteModalOpen(true)}>
            Delete
          </Button>
        )}
        {showWithdrawButton && <Button onClick={() => openWithdrawModal('Approval')}>Withdraw Approval</Button>}
        {showWithdrawRejectionButton && <Button onClick={() => openWithdrawModal('Rejection')}>Withdraw Rejection</Button>}
        {showRequiresChangeActions && <Button onClick={() => openWithdrawModal('Requires Change')}>Withdraw Requires Change</Button>}
      </div>

      {approveModalOpen && <ApproveModal open={approveModalOpen} data={data} onModalClosed={() => setApproveModalOpen(false)} />}
      {rejectModalOpen && <RejectModal open={rejectModalOpen} data={data} onModalClosed={() => setRejectModalOpen(false)} />}
      {requireChangeModalOpen && (
        <RequireChangeModal open={requireChangeModalOpen} data={data} onModalClosed={() => setRequireChangeModalOpen(false)} />
      )}
      {deleteModalOpen && (
        <DeleteModal
          onModalClosed={() => setDeleteModalOpen(false)}
          open={deleteModalOpen}
          data={data}
          redirectTo={`/approvals?status=${data.status === SUBMITTED_BY_APPROVER_STATUS ? SUBMITTED_STATUS : data.status}`}
        />
      )}
      {withdrawModalOpen && (
        <WithdrawModal open={withdrawModalOpen} text={withdrawModalText} data={data} onModalClosed={() => setWithdrawModalOpen(false)} />
      )}
    </>
  )
}

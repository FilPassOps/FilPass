import { Button } from 'components/shared/Button'
import { GoBackConfirmation } from 'components/shared/GoBackConfirmation'
import { DRAFT_STATUS } from 'domain/transferRequest/constants'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { DeleteModal } from '../shared/DeleteModal'

interface FooterButtonsProps {
  isEditable: boolean
  data: {
    isDraft: boolean
    id: string
    status: string
  }
  isSubmitting: boolean
  reset: () => void
}

export const FooterButtons = ({ isEditable, data, isSubmitting, reset }: FooterButtonsProps) => {
  const [openConfirmation, setOpenConfirmation] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const router = useRouter()

  const showBackButton = isEditable || data?.isDraft
  const showClearAllButton = !isEditable && !data?.isDraft
  const showDeleteButton = data?.status === DRAFT_STATUS
  return (
    <>
      <div className="flex justify-center space-x-3 mt-5">
        {showBackButton && (
          <div>
            <Button variant="outline" type="button" onClick={() => setOpenConfirmation(true)}>
              Back
            </Button>
          </div>
        )}
        {showClearAllButton && (
          <div>
            <Button variant="outline" onClick={() => reset()}>
              Clear All
            </Button>
          </div>
        )}
        {showDeleteButton && (
          <div>
            <Button variant="primary-lighter" onClick={() => setDeleteModalOpen(true)}>
              Delete
            </Button>
          </div>
        )}

        <div>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            Submit
          </Button>
        </div>
      </div>
      <GoBackConfirmation
        isOpen={openConfirmation}
        setIsOpen={setOpenConfirmation}
        confirmGoBack={() => {
          if (data?.isDraft) {
            router.replace('/my-transfer-requests')
          } else {
            router.replace(`/transfer-requests/${data?.id}`)
          }
        }}
      />
      <DeleteModal
        onModalClosed={() => setDeleteModalOpen(false)}
        open={deleteModalOpen}
        redirectTo={'/my-transfer-requests'}
        data={data}
      />
    </>
  )
}

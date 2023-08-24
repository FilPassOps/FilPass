import { DeliveryMethod, ProgramVisibility } from '@prisma/client'
import { useAlertDispatcher } from 'components/Layout/Alerts'
import { Button } from 'components/shared/Button'
import { api } from 'lib/api'
import { useState } from 'react'

interface UseCreateOrEditProgramSubmitProps {
  refreshPrograms: () => void
  programId?: string
  onModalClosed: () => void
  reset: () => void
  isEditable: boolean
  dirtyFields: any
  isArchived?: boolean
}

export interface ProgramValues {
  superId: number
  approversRole: { roleId: number }[][]
  viewersRole: { roleId: number }[]
  id: number
  programCurrency: {
    name: string
    type: string
  }[]
  name: string
  signersWalletAddresses?: { address: string }[]
  visibility: ProgramVisibility
  updateApprovers: boolean
  updateViewers: boolean
  isArchived?: boolean
  deliveryMethod?: DeliveryMethod
}

export const useCreateOrEditProgramSubmit = ({
  refreshPrograms,
  programId,
  onModalClosed,
  reset,
  isEditable,
  dirtyFields,
  isArchived,
}: UseCreateOrEditProgramSubmitProps) => {
  const [submitErrors, setSubmitErrors] = useState<any>()
  const { dispatch, close } = useAlertDispatcher()

  const handleFormSubmit = async (values: ProgramValues, e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    setSubmitErrors(null)

    const handleCreateOrEditProgramError = (error: any) => {
      if (error) {
        setSubmitErrors(error.errors)
      } else {
        onModalClosed()
        reset()
        refreshPrograms()
      }
    }
    const edit = async (updateApprovers: boolean) => {
      const updateViewers = 'viewersRole' in dirtyFields || values.viewersRole.length === 0

      if (!programId) {
        setSubmitErrors('Something went wrong, please try again later')
        return
      }

      const { error } = await editProgram({
        programId,
        values: { ...values, updateApprovers, updateViewers, isArchived },
      })
      handleCreateOrEditProgramError(error)
    }

    const EditApproverHandler = () => (
      <>
        <p>
          Requests in <span className="font-semibold">Processing</span> status associated with the program will rollback to{' '}
          <span className="font-semibold">Submitted</span> status
        </p>
        <div className="pt-6 flex items-center justify-between gap-2 md:gap-4">
          <Button variant="outline" onClick={() => close()}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              close()
              await edit(true)
            }}
          >
            Continue
          </Button>
        </div>
      </>
    )

    if (!isEditable && !programId) {
      const { error } = await createProgram({ values })
      handleCreateOrEditProgramError(error)
    }

    if (isEditable && programId) {
      if ('approversRole' in dirtyFields) {
        return dispatch({
          type: 'warning',
          title: 'Warning',
          body: () => <EditApproverHandler />,
        })
      }
      await edit(false)
    }
  }

  return { handleFormSubmit, setSubmitErrors, submitErrors }
}

const createProgram = async ({ values }: { values: ProgramValues }) => await api.post('/programs', values)

const editProgram = async ({ programId, values }: { programId: string; values: ProgramValues }) =>
  await api.patch(`/programs/${programId}`, values)

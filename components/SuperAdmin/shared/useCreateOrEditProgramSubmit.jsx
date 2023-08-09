import { useAlertDispatcher } from 'components/Layout/Alerts'
import { Button } from 'components/shared/Button'
import { api } from 'lib/api'
import { useState } from 'react'

export const useCreateOrEditProgramSubmit = ({ refreshPrograms, programId, onModalClosed, reset, isEditable, dirtyFields, isArchived }) => {
  const [submitErrors, setSubmitErrors] = useState()
  const { dispatch, close } = useAlertDispatcher()

  const handleFormSubmit = async (values, e) => {
    e.preventDefault()
    setSubmitErrors()

    const handleCreateOrEditProgramError = error => {
      if (error) {
        setSubmitErrors(error.errors)
      } else {
        onModalClosed()
        reset()
        refreshPrograms()
      }
    }
    const edit = async updateApprovers => {
      const updateViewers = 'viewersRole' in dirtyFields || values.viewersRole.length === 0

      const { error } = await editProgram({
        programId,
        values: { updateApprovers, updateViewers, isArchived, ...values },
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

const createProgram = async ({ values }) => await api.post('/programs', values)

const editProgram = async ({ programId, values }) => await api.patch(`/programs/${programId}`, values)

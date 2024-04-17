import { api } from 'lib/api'
import { DateTime } from 'luxon'
import { useState } from 'react'

interface UseFormSubmitProps {
  errors: any
  data: {
    id: string
    isDraft: boolean
    applyerId: string
  }
  isEditable?: boolean
}

interface CreateTransferRequestProps {
  values: any
  setSubmitErrors: any
}

interface EditTransferRequestProps {
  id: string
  values: any
  setSubmitErrors: any
}

interface SubmitDraftTransferRequestProps {
  values: any
  data: {
    id: string
    applyerId: string
  }
  setSubmitErrors: any
}

export const useFormSubmit = ({ errors, data, isEditable = false }: UseFormSubmitProps) => {
  const [submitErrors, setSubmitErrors] = useState<any>()
  const [openSubmittedModal, setOpenSubmittedModal] = useState(false)

  const handleFormSubmit = async (values: any) => {
    if (Object.keys(errors).length > 0) {
      console.error('errors', errors)
      return
    }

    if (!isEditable && !data?.isDraft) {
      await createTransferRequest({ values, setSubmitErrors })
    }
    if (isEditable && !data?.isDraft) {
      await editTransferRequest({ id: data.id, values, setSubmitErrors })
    }
    if (isEditable && data?.isDraft) {
      await submitDraftTransferRequest({ values, data, setSubmitErrors })
    }

    setOpenSubmittedModal(true)
  }

  return { submitErrors, setSubmitErrors, openSubmittedModal, handleFormSubmit }
}

const createTransferRequest = async ({ values, setSubmitErrors }: CreateTransferRequestProps) => {
  const { data, error } = await api.post('/transfer-requests', values)
  const transferRequestError = error || data?.error

  setSubmitErrors(transferRequestError)
}

const editTransferRequest = async ({ id, values, setSubmitErrors }: EditTransferRequestProps) => {
  const { error, data } = await api.patch(`/transfer-requests/${id}`, {
    ...values,
    expectedTransferDate: DateTime.now().plus({ days: 30 }).toISO(),
    createdAt: DateTime.now().toISO(),
  })
  const transferRequestError = error || data?.error

  setSubmitErrors(transferRequestError)
}

const submitDraftTransferRequest = async ({ values, data, setSubmitErrors }: SubmitDraftTransferRequestProps) => {
  const { error, data: draftData } = await api.post(`/transfer-requests-draft/${data?.id}`, {
    ...values,
    applyerId: data?.applyerId,
  })

  const transferRequestError = error || draftData?.error

  setSubmitErrors(transferRequestError)
}

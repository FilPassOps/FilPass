import { useAuth } from 'components/Authentication/Provider'
import { useOnboard } from 'components/OnboardingWrapper'
import { api } from 'lib/api'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { useSWRConfig } from 'swr'

export const useFormSubmit = ({ errors, data, isEditable = false }) => {
  const { cache } = useSWRConfig()

  const [submitErrors, setSubmitErrors] = useState()
  const [openSubmittedModal, setOpenSubmittedModal] = useState(false)
  const { user } = useAuth()
  const { setOpenOnboardingModal } = useOnboard()

  const handleFormSubmit = async values => {
    if (Object.keys(errors).length > 0) {
      console.error('errors', errors)
      return
    }

    if (!user.piiUpdatedAt || !user.terms || !user.isTaxFormActive) {
      setOpenOnboardingModal(true)
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
    cache.clear()
  }

  return { submitErrors, setSubmitErrors, openSubmittedModal, handleFormSubmit }
}

const createTransferRequest = async ({ values, setSubmitErrors }) => {
  const { data, error } = await api.post('/transfer-requests', values)
  const transferRequestError = error || data.error

  setSubmitErrors(transferRequestError)
}

const editTransferRequest = async ({ id, values, setSubmitErrors }) => {
  const { error, data } = await api.patch(`/transfer-requests/${id}`, {
    ...values,
    expectedTransferDate: DateTime.now().plus({ days: 30 }).toISO(),
    createdAt: DateTime.now().toISO(),
  })
  const transferRequestError = error || data.error

  setSubmitErrors(transferRequestError)
}

const submitDraftTransferRequest = async ({ values, data, setSubmitErrors }) => {
  const { error, data: draftData } = await api.post(`/transfer-requests-draft/${data?.id}`, {
    ...values,
    applyerId: data?.applyerId,
  })

  const transferRequestError = error || draftData.error

  setSubmitErrors(transferRequestError)
}

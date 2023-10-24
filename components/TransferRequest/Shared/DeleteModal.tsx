import { Button } from 'components/Shared/Button'
import { Modal } from 'components/Shared/Modal'
import { DRAFT_STATUS, SUBMITTED_BY_APPROVER_STATUS } from 'domain/transfer-request/constants'
import { BaseApiResult, api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Link from 'next/link'
import qs from 'qs'
import { ParamsSerializerOptions } from 'axios'
import React from 'react'

interface DeleteModalProps {
  onModalClosed: () => void
  open: boolean
  data: any
  redirectTo?: string
}

export const DeleteModal = ({ onModalClosed, open, data, redirectTo }: DeleteModalProps) => {
  const { push } = useRouter()
  const [error, setError] = useState<any>()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)

    if (data.status === DRAFT_STATUS) {
      const { error } = await api.patch(`/transfer-requests-draft/${data.id}`)

      if (error) {
        return setError(error?.message || error?.errors)
      }
    }

    if (
      data.status === SUBMITTED_BY_APPROVER_STATUS ||
      (Array.isArray(data) && data.every(({ status }) => status === SUBMITTED_BY_APPROVER_STATUS))
    ) {
      let requests = []
      if (Array.isArray(data)) {
        requests = data.map(request => request.id)
      } else {
        requests = [data.id]
      }

      const { error } = (await api.delete(`/transfer-requests`, {
        params: {
          requests: requests.join(','),
        },
        paramsSerializer: qs.stringify as ParamsSerializerOptions,
      })) as BaseApiResult
      setIsLoading(false)

      if (error) {
        if (error.errors) {
          return setError(error?.errors.requests)
        }
        return setError(error)
      }
    }

    setIsLoading(false)
    onModalClosed()
    if (redirectTo) {
      push(redirectTo)
    }
  }

  const warningText = () => {
    if (Array.isArray(data)) {
      return (
        <>
          {`requests `}
          {data.map(({ id }, index) => (
            <React.Fragment key={id}>
              <Link href={`/approvals/${id}`} passHref={true} className="text-sky-700 underline" target="_blank">
                #{id}
              </Link>
              {index === data.length - 1 ? '' : `, `}
            </React.Fragment>
          ))}
        </>
      )
    }

    return 'request'
  }

  return (
    <Modal open={open} onModalClosed={onModalClosed}>
      <div className="space-y-9 text-center">
        <h2 className="text-gray-900 text-lg font-medium">Delete transfer request</h2>
        <p className="text-gray-500 text-sm">Are you sure you want to delete the transfer {warningText()}?</p>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onModalClosed}>
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={isLoading} loading={isLoading}>
            Yes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

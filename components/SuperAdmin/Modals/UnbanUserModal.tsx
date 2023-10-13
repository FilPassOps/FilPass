import { AxiosResponse } from 'axios'
import { Button } from 'components/Shared/Button'
import { Modal } from 'components/Shared/Modal'
import { api } from 'lib/api'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface GenericApiResponse extends AxiosResponse {
  error: any
}
interface UnbanUserModalProps {
  open: boolean
  user: {
    id: number
    email: string
  }
  onModalClosed: () => void
}

export const UnbanUserModal = ({ open, user, onModalClosed }: UnbanUserModalProps) => {
  const router = useRouter()
  const [error, setError] = useState('')

  const closeModal = () => {
    onModalClosed()
    setError('')
  }

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const handleUnban = async () => {
    const { error: responseError }: GenericApiResponse = await api.post(`/users/${user.id}/unban`)
    if (responseError) {
      setError(responseError.message)
      return
    }
    closeModal()
    router.reload()
  }

  if (!user) {
    return null
  }

  return (
    <Modal open={open} onModalClosed={closeModal}>
      <form onSubmit={handleSubmit(handleUnban)} className="space-y-6">
        <div className="flex flex-col gap-8 text-center">
          <h2 className="text-gray-900 text-lg font-medium">Unban user</h2>
          <p className="text-sm font-medium leading-5 text-gray-700">{`Are you sure you want to unban ${user.email}?`}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            {/* @ts-ignore */}
            <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
              Submit
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

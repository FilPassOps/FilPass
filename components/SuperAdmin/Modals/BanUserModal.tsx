import { yupResolver } from '@hookform/resolvers/yup'
import { AxiosResponse } from 'axios'
import { Button } from 'components/Shared/Button'
import { TextArea } from 'components/Shared/FormInput'
import { Modal } from 'components/Shared/Modal'
import { api } from 'lib/api'
import yup from 'lib/yup'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface GenericApiResponse extends AxiosResponse {
  error: any
}
interface FormValues {
  banReason: string
}

interface BanUserModalProps {
  open: boolean
  user: {
    id: number
    email: string
  }
  onModalClosed: () => void
}

export const BanUserModal = ({ open, user, onModalClosed }: BanUserModalProps) => {
  const router = useRouter()

  const [error, setError] = useState<any>()

  const closeModal = () => {
    onModalClosed()
    setError(null)
    setTimeout(reset, 300)
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(yup.object({ banReason: yup.string().trim().required().max(500) }).required()),
  })

  const handleBan = async ({ banReason }: FormValues) => {
    const { error: responseError }: GenericApiResponse = await api.post(`/users/${user.id}/ban`, { banReason })
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
      <form onSubmit={handleSubmit(handleBan)} className="space-y-6">
        <div className="flex flex-col gap-8 text-center">
          <h2 className="text-gray-900 text-lg font-medium">Ban user</h2>
          <p className="text-sm font-medium leading-5 text-gray-700">{`Are you sure you want to ban ${user.email}?`}</p>
          <div>
            <TextArea
              // @ts-ignore
              label="Reason"
              error={errors?.banReason}
              maxLength={500}
              {...register('banReason')}
            />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            {/* @ts-ignore */}
            <Button variant='dark-red' type="submit" disabled={isSubmitting} loading={isSubmitting}>
              Submit
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

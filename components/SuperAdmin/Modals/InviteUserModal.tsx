import { Modal } from 'components/Shared/Modal'
import { Button } from 'components/Shared/Button'
import { TextInput } from 'components/Shared/FormInput'
import { inviteUserValidatorForm } from 'domain/auth/validation'
import { api } from 'lib/api'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useRouter } from 'next/router'

interface InviteUserModalProps {
  onModalClosed: () => void
  open: boolean
}

export const InviteUserModal = ({ onModalClosed, open }: InviteUserModalProps) => {
  const router = useRouter()
  const [error, setError] = useState<any>()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    reset,
  } = useForm({
    defaultValues: {
      email: '',
    },
    resolver: yupResolver(inviteUserValidatorForm),
  })

  const handleInviteUser = async (body: { email: string }) => {
    const { data, error } = await api.post('auth/invite', body)

    if (error) {
      return setError(error)
    }

    router.reload()
    return data
  }

  const handleCloseModal = () => {
    setError(null)
    reset()
    clearErrors()
    onModalClosed()
  }

  return (
    <Modal open={open} onModalClosed={handleCloseModal}>
      <form onSubmit={handleSubmit(handleInviteUser)} className="space-y-6">
        <h2 className="text-gray-900 text-lg text-center font-medium">Add New User</h2>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        <TextInput id="email" type="email" label="User Email" error={errors.email} {...register('email')} />
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onModalClosed}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            Add
          </Button>
        </div>
      </form>
    </Modal>
  )
}

import { Modal } from 'components/Shared/Modal'
import { Button } from 'components/Shared/Button'
import { NumberInput } from 'components/Shared/FormInput'
import { api } from 'lib/api'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { splitTokensValidator } from 'domain/transfer-credits/validation'
import { useRouter } from 'next/router'

interface SplitTokensModalProps {
  onModalClosed: () => void
  open: boolean
  userCreditId: string
}

export const SplitTokensModal = ({ onModalClosed, open, userCreditId }: SplitTokensModalProps) => {
  const [error, setError] = useState<any>()
  const [success, setSuccess] = useState<boolean>(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    reset,
  } = useForm({
    defaultValues: {
      splitNumber: 0,
    },
    resolver: yupResolver(splitTokensValidator),
  })

  const handleSplitTokens = async (body: { splitNumber: number }) => {
    // TODO: verify the credits and check for a maximum number of splits
    const { error } = await api.post('transfer-credits/split-tokens', {
      userCreditId,
      splitNumber: body.splitNumber,
    })

    if (error) {
      return setError(error)
    }

    setSuccess(true)
  }

  const handleCloseModal = () => {
    setError(null)
    setSuccess(false)
    reset({ splitNumber: 0 })
    clearErrors()
    onModalClosed()

    // Refresh the page after closing the modal
    router.reload()
  }

  return (
    <Modal open={open} onModalClosed={handleCloseModal}>
      <form onSubmit={handleSubmit(handleSplitTokens)} className="space-y-6">
        <h2 className="text-gray-900 text-lg text-center font-medium">Create Vouchers</h2>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        {success && <p className="text-green-600 text-center text-sm mt-4">Vouchers created successfully</p>}
        <NumberInput id="splitNumber" type="number" label="Split Number" error={errors.splitNumber} {...register('splitNumber')} />
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onModalClosed}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  )
}

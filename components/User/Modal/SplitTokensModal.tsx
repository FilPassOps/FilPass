import { Modal } from 'components/Shared/Modal'
import { Button } from 'components/Shared/Button'
import { NumberInput } from 'components/Shared/FormInput'
import { api } from 'lib/api'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { splitTokensValidator } from 'domain/transfer-credits/validation'
import { useRouter } from 'next/router'
import { BigNumber } from 'ethers'

interface SplitTokensModalProps {
  onModalClosed: () => void
  open: boolean
  userCreditId: string
  currentCredits: BigNumber
  availableTokenNumber: number
}

export const SplitTokensModal = ({ onModalClosed, open, userCreditId, currentCredits, availableTokenNumber }: SplitTokensModalProps) => {
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
      creditPerVoucher: 0,
    },
    resolver: yupResolver(splitTokensValidator(currentCredits, availableTokenNumber)),
  })

  const handleSplitTokens = async (body: { splitNumber: number; creditPerVoucher: number }) => {
    // TODO: verify the credits and check for a maximum number of splits
    const { error } = await api.post('transfer-credits/split-tokens', {
      userCreditId,
      splitNumber: body.splitNumber,
      creditPerVoucher: body.creditPerVoucher,
    })

    if (error) {
      return setError(error)
    }

    setSuccess(true)
  }

  const handleCloseModal = () => {
    setError(null)
    setSuccess(false)
    reset({ splitNumber: 0, creditPerVoucher: 0 })
    clearErrors()
    onModalClosed()

    router.reload()
  }

  return (
    <Modal open={open} onModalClosed={handleCloseModal}>
      <form onSubmit={handleSubmit(handleSplitTokens)} className="space-y-6">
        <h2 className="text-gray-900 text-lg text-center font-medium">Create Vouchers</h2>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        {success && <p className="text-green-600 text-center text-sm mt-4">Vouchers created successfully</p>}
        <NumberInput id="splitNumber" type="number" label="Number of Vouchers" error={errors.splitNumber} {...register('splitNumber')} />
        <NumberInput
          //  @ts-ignore
          label="Credit Per Voucher"
          error={errors.creditPerVoucher}
          decimalScale={6}
          {...register('creditPerVoucher', {
            setValueAs: val => {
              const parsedValue = parseFloat(String(val).replaceAll(/[, \s]+/g, ''))
              return isNaN(parsedValue) ? 0 : parsedValue
            },
          })}
        />
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

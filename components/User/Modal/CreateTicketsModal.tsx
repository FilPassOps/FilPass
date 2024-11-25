import { Modal } from 'components/Shared/Modal'
import { Button } from 'components/Shared/Button'
import { NumberInput } from 'components/Shared/FormInput'
import { api } from 'lib/api'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { createTicketsValidator } from 'domain/transfer-credits/validation'
import { useRouter } from 'next/router'
import { BigNumber } from 'ethers'

interface CreateTicketsModalProps {
  onModalClosed: () => void
  open: boolean
  userCreditId: string
  currentCredits: BigNumber
  availableTicketsNumber: number
}

export const CreateTicketsModal = ({
  onModalClosed,
  open,
  userCreditId,
  currentCredits,
  availableTicketsNumber,
}: CreateTicketsModalProps) => {
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
      creditPerTicket: 0,
    },
    resolver: yupResolver(createTicketsValidator(currentCredits, availableTicketsNumber)),
  })

  const handleCreateTickets = async (body: { splitNumber: number; creditPerTicket: number }) => {
    const { error } = await api.post('transfer-credits/create-tickets', {
      userCreditId,
      splitNumber: body.splitNumber,
      creditPerTicket: body.creditPerTicket,
    })

    if (error) {
      return setError(error)
    }

    setSuccess(true)
  }

  const handleCloseModal = () => {
    setError(null)
    setSuccess(false)
    reset({ splitNumber: 0, creditPerTicket: 0 })
    clearErrors()
    onModalClosed()

    if (success) {
      router.reload()
    }
  }

  return (
    <Modal open={open} onModalClosed={handleCloseModal}>
      <form onSubmit={handleSubmit(handleCreateTickets)} className="space-y-6">
        <h2 className="text-gray-900 text-lg text-center font-medium">Create Tickets</h2>
        {error?.message && <p className="text-red-600 text-center text-sm mt-4">{error.message}</p>}
        {success && <p className="text-green-600 text-center text-sm mt-4">Tickets created successfully</p>}
        <NumberInput id="splitNumber" type="number" label="Number of Tickets" error={errors.splitNumber} {...register('splitNumber')} />
        <NumberInput
          //  @ts-ignore
          label="Credit Per Ticket"
          error={errors.creditPerTicket}
          decimalScale={6}
          {...register('creditPerTicket', {
            setValueAs: val => {
              const parsedValue = parseFloat(String(val).replaceAll(/[, \s]+/g, ''))
              return isNaN(parsedValue) ? 0 : parsedValue
            },
          })}
        />
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleCloseModal}>
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

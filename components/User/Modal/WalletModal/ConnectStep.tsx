import { yupResolver } from '@hookform/resolvers/yup'
import { useAuth } from 'components/Authentication/Provider'
import { Button } from 'components/Shared/Button'
import { TextInput } from 'components/Shared/FormInput'
import { connectWalletStepValidator } from 'domain/wallet-verification/validation'
import { api } from 'lib/api'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface ConnectStepProps {
  onBackClick: () => void
  onNextStepClick: (data: any) => void
  wallet: string
  blockchainName: string
}

interface FormValues {
  blockchain: string
  address: string
  name?: string
}

export function ConnectStep({ onBackClick, onNextStepClick, wallet, blockchainName }: ConnectStepProps) {
  const { user } = useAuth()
  const [submitErrors, setSubmitErrors] = useState<any>()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      blockchain: blockchainName,
      address: wallet,
      name: '',
    },
    resolver: yupResolver(connectWalletStepValidator),
  })

  const handleFormSubmit = async (formData: FormValues) => {
    const existingDefault = user?.wallets?.find(
      wallet => wallet.address.toLowerCase() === formData.address.toLowerCase() && wallet.blockchain.name === formData.blockchain,
    )

    if (existingDefault) {
      setSubmitErrors({
        address: { message: errorsMessages.wallet_address_in_use.message },
      })
      return
    }

    const { error } = await api.get(`/wallet-address/${formData.address}/validate`)

    if (error) {
      return setSubmitErrors({
        address: error,
      })
    }

    onNextStepClick(formData)
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center space-y-6 sm:px-11">
      <p className="font-medium text-lg text-gray-900 text-center">Connect Wallet</p>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full h-full space-y-6 ">
        <TextInput
          label="Blockchain"
          id="blockchain"
          readOnly={true}
          disabled
          error={errors.blockchain || submitErrors?.blockchain}
          {...register('blockchain')}
        />

        <TextInput
          label="Wallet Address"
          id="address"
          maxLength={100}
          disabled={true}
          error={errors.address || submitErrors?.address}
          {...register('address')}
        />
        <div className="flex justify-center items-center space-x-6">
          <Button variant="outline" onClick={onBackClick}>
            Back
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Next
          </Button>
        </div>
      </form>
    </div>
  )
}

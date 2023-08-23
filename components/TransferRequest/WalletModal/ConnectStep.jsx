import { yupResolver } from '@hookform/resolvers/yup'
import { useAuth } from 'components/Authentication/Provider'
import { Button } from 'components/shared/Button'
import { TextInput } from 'components/shared/FormInput'
import { connectWalletStepValidator } from 'domain/walletVerification/validation'
import { api } from 'lib/api'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import errorsMessages from 'wordings-and-errors/errors-messages'

export function ConnectStep({ onBackClick, onNextStepClick, connectionMethod, wallet, blockchainName }) {
  const { user } = useAuth()
  const [submitErrors, setSubmitErrors] = useState()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      blockchain: connectionMethod === 'Filecoin' ? 'Filecoin' : blockchainName, // TODO OPEN-SOURCE: should the id of the blockchain table
      address: connectionMethod === 'Metamask' ? wallet : '',
    },
    resolver: yupResolver(connectWalletStepValidator),
  })

  const handleFormSubmit = async formData => {
    const addressIndex = user.wallets?.findIndex(wallet => wallet.address.toLowerCase() === formData.address.toLowerCase())

    if (addressIndex >= 0) {
      setSubmitErrors({
        address: errorsMessages.wallet_address_in_use,
      })
      return
    }

    if (connectionMethod === 'Metamask') {
      onNextStepClick(formData)
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
          disabled={connectionMethod === 'Metamask'}
          error={errors.address || submitErrors?.address}
          {...register('address')}
        />
        <TextInput label="Wallet Label (Optional)" id="name" maxLength={100} {...register('name')} />
        <div className="flex justify-center items-center space-x-6">
          <Button variant="outline" onClick={onBackClick}>
            Back
          </Button>
          <Button type="submit" loading={isSubmitting} disable={isSubmitting}>
            Next
          </Button>
        </div>
      </form>
    </div>
  )
}

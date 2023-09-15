import { yupResolver } from '@hookform/resolvers/yup'
import { SelectNetworkInput } from 'components/shared/SelectNetworkInput'
import { WithMetaMaskButton } from 'components/web3/MetaMaskProvider'
import yup from 'lib/yup'
import { useForm } from 'react-hook-form'

interface ChainSelectionProps {
  onConnectionMethodClick: (chainId: string) => void
}

export function ChainSelection({ onConnectionMethodClick }: ChainSelectionProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      chainId: undefined,
    },
    resolver: yupResolver(
      yup.object({
        chainId: yup.string().required(),
      }),
    ),
  })

  const { chainId } = watch()

  const handleSubmitForm = async (formData: any) => {
    onConnectionMethodClick(formData.blockchainId)
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)}>
      <div className="w-full h-full flex flex-col justify-center items-center sm:py-2 sm:px-11">
        <p className="font-medium text-lg text-gray-900 text-center mb-2">Connect Wallet</p>
        <p className="font-normal text-sm text-gray-500 text-center">Connect a default wallet address.</p>
        <div className="flex flex-col w-full gap-6 mt-6">
          <SelectNetworkInput control={control} errors={errors.chainId} label="Select Network" placeholder="Choose wallet network" />

          <WithMetaMaskButton
            type="submit"
            className="w-full"
            buttonStyle="flex gap-2 justify-center items-center"
            targetChainId={chainId}
          />
        </div>
      </div>
    </form>
  )
}

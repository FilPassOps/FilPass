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
    <div className="w-full h-full flex flex-col gap-4 justify-center items-center space-y-6 sm:px-11 my-6">
      <span className='flex flex-col gap-2'>
        <p className="font-medium text-lg text-gray-900 text-center">Connect Wallet</p>
        <p className="font-normal text-sm text-gray-500 text-center">Connect a default wallet address.</p>
      </span>
      <form onSubmit={handleSubmit(handleSubmitForm)} className="flex flex-col gap-4 w-full h-full space-y-6 ">
        <SelectNetworkInput control={control} errors={errors.chainId} label="Select Network" placeholder="Choose wallet network" />
        <div className="flex w-full">
          <WithMetaMaskButton type="submit" className="w-full" targetChainId={chainId} />
        </div>
      </form>
    </div>
  )
}

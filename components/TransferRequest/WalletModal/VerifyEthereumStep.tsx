import { AxiosResponse } from 'axios'
import { Button } from 'components/Shared/Button'
import { BlockchainIcon } from 'components/Shared/icons/BlockchainIcon'
import { api } from 'lib/api'
import { useState } from 'react'

interface GenericApiResponse extends AxiosResponse {
  error: any
}

interface VerifyEthereumStepProps {
  onNextStepClick: (stepData: any) => void
  setUserWalletId: (id: number) => void
  onBackClick: () => void
  formData: {
    address: string
    name: string
    blockchain: string
  }
  networkName: string
}

export const VerifyEthereumStep = ({ onNextStepClick, onBackClick, formData, networkName, setUserWalletId }: VerifyEthereumStepProps) => {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onVerifyClick() {
    setLoading(true)

    try {
      const { error, data }: GenericApiResponse = await api.post('/wallets/ethereum', {
        walletAddress: formData.address,
        label: formData.name,
        blockchain: formData.blockchain,
      })

      if (error) {
        setError(error.message)
        return
      }
      onNextStepClick({
        ...formData,
        verification: false,
        success: !error,
      })

      setUserWalletId(data.id)
    } catch (error: any) {
      setError('Unexpected error occurred. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center sm:py-2 sm:px-11">
      <p className="font-medium text-lg text-gray-900 text-center">Verify Wallet Address</p>
      <p className="font-normal text-sm text-gray-500 text-center mt-2">Confirm your MetaMask wallet address to continue</p>
      <div className="flex flex-col p-4 space-y-2 text-blue-900 font-medium text-sm bg-blue-50 border border-blue-200 rounded-md w-full my-6">
        <div className="flex items-center gap-2 ">
          <BlockchainIcon blockchainName={formData.blockchain} className="h-5 w-5" />
          <span>{`${formData.blockchain} ${networkName}`} MetaMask Address</span>
        </div>
        <span className="text-blue-700 break-all">{formData?.address}</span>
      </div>
      <div className="w-full flex flex-col justify-center items-center space-y-4">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
      <div className="w-full flex justify-center items-center space-x-4">
        <Button variant="outline" onClick={onBackClick}>
          Back
        </Button>
        <Button onClick={onVerifyClick} loading={loading} disabled={loading}>
          Confirm
        </Button>
      </div>
    </div>
  )
}

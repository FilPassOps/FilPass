import { Button } from 'components/shared/Button'
import { useState } from 'react'

interface AlertSkipStepProps {
  onNextStepClick: (data: any) => void
  formData: {
    walletAddress: string
    walletName: string
    walletId: number
    verification: boolean
    success: boolean
  }
  setUserWalletId: (id: number) => void
  onBackClick: () => void
  createWallet: (data: any) => Promise<any>
}

// TODO: still maintain this file?
export const AlertSkipStep = ({ onNextStepClick, formData, setUserWalletId, onBackClick, createWallet }: AlertSkipStepProps) => {
  const [loading, setLoading] = useState(false)

  const handleSkipClick = async () => {
    setLoading(true)

    const { data, error } = await createWallet(formData)
    onNextStepClick({
      ...formData,
      verification: false,
      success: !error,
    })
    if (!error) {
      setUserWalletId(data.id)
    }
  }
  return (
    <div className="w-full h-full flex flex-col justify-center items-center space-y-10">
      <p className="font-medium text-lg text-gray-900 text-center">Skip verify wallet address</p>
      <div>
        <p className="text-sm leading-5 text-gray-500 text-center mt-2">
          {`If you skip the wallet verification step and provide an incorrect wallet address, your funds
        will be lost and there's no way to recover them.`}
        </p>
      </div>
      <div className="flex w-full space-x-3">
        <Button variant="outline" onClick={onBackClick}>
          Back
        </Button>
        <Button onClick={handleSkipClick} loading={loading} disabled={loading}>
          Confirm
        </Button>
      </div>
    </div>
  )
}

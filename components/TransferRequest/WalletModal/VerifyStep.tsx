import { yupResolver } from '@hookform/resolvers/yup'
import { useAuth } from 'components/Authentication/Provider'
import { Button } from 'components/shared/Button'
import { NumberInput } from 'components/shared/FormInput'
import { FilecoinIcon } from 'components/shared/icons/chains/FilecoinIcon'
import { verifyWalletStepValidator } from 'domain/walletVerification/validation'
import { api } from 'lib/api'
import { classNames } from 'lib/classNames'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface VerifyStepProps {
  onNextStepClick: (data: any) => void
  onCancelClick: () => void
  formData: {
    address: string
    blockchain: string
    name: string
  }
  setUserWalletId: (id: number) => void
  createWallet: (data: any) => Promise<any>
}

interface Verification {
  id: number
  isVerified: boolean
}

interface VerificationResponse {
  data: Verification
  error: any
}

export function VerifyStep({ onNextStepClick, onCancelClick, formData, setUserWalletId, createWallet }: VerifyStepProps) {
  const [loading, setLoading] = useState(true)
  const [sendLoading, setSendLoading] = useState(false)
  const [verification, setVerification] = useState<Verification>()
  const { user } = useAuth()
  const canSkipVerify = !user?.email.endsWith('@protocol.ai') ?? false

  useEffect(() => {
    const getWalletVerification = async (address: string) => {
      const { data: verification, error: verificationError } = await api.get(`/wallet-verifications?address=${address}`)
      if (verificationError) {
        console.log(verificationError)
        return
      }

      if (verification?.id && verification?.isVerified) {
        const { data, error } = await createWallet({
          ...formData,
          verificationId: verification.id,
        })
        onNextStepClick({
          ...formData,
          verification: true,
          success: !error,
          skipAlert: false,
        })
        if (!error) {
          setUserWalletId(data.id)
        }
        return
      }

      setVerification(verification)
      setLoading(false)
    }

    getWalletVerification(formData.address)
  }, [formData, createWallet, onNextStepClick, setUserWalletId])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      amount: undefined,
    },
    resolver: yupResolver(verifyWalletStepValidator),
  })

  const handleFormSubmit = async ({ amount }: { amount: number }) => {
    const { data, error } = await api.post(`/wallet-verifications/${verification?.id}/verify`, {
      amount,
      unit: 'FIL',
      name: formData.name,
    })

    if (error) {
      return alert(error.message)
    }

    if (!error) {
      onNextStepClick({
        ...formData,
        ...data,
        verification: true,
        success: !error,
        skipAlert: false,
      })

      return setUserWalletId(data.id)
    }
  }

  const handleSkipClick = async () =>
    canSkipVerify &&
    onNextStepClick({
      ...formData,
      skipAlert: true,
    })

  const handleSendClick = async () => {
    setSendLoading(true)

    const { data, error } = (await api.post('/wallet-verifications', {
      address: formData.address,
      blockchain: formData.blockchain,
    })) as VerificationResponse

    if (error) {
      alert(error.message)
    }

    if (!error) {
      setVerification(data)
    }

    setSendLoading(false)
  }

  if (!user) return null

  return (
    <div className="w-full h-full flex flex-col justify-center items-center space-y-6">
      <p className="font-medium text-lg text-gray-900 text-center">Verify Wallet Address</p>
      <div className="flex flex-col p-4 space-y-1 text-indigo-900 font-medium text-sm bg-indigo-50 border border-indigo-200 rounded-md w-full">
        <div className="flex items-center space-x-1">
          <FilecoinIcon className="h-5 w-5" />
          <span>Filecoin</span>
        </div>
        <span className="text-indigo-700 break-all">{formData.address}</span>
      </div>
      <div className="flex flex-col space-y-1">
        {canSkipVerify && (
          <p className="text-sm leading-5 font-medium text-gray-700">I would like to verify my wallet address (recommended)</p>
        )}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-4 border space-x-4 border-gray-200 rounded-md py-3 px-3">
          <div className="col-span-3 flex flex-col space-y-3">
            <div className="text-sm leading-5 text-gray-500">
              {verification ? (
                <>
                  <p className="mb-1.5">
                    We have sent a test transaction to the wallet address, please confirm you have received it and enter the amount you
                    received below.
                  </p>
                  <p>It may take up to 10 minutes for the transaction to appear in your wallet.</p>
                </>
              ) : (
                `We will send you a random amount of Filecoin to your wallet for verification, click
              “Send” and enter the amount you receive to verify your wallet.`
              )}
            </div>
            <NumberInput
              id="amount"
              label="Received FIL Amount"
              rightIcon="FIL"
              error={errors.amount}
              thousandSeparator={true}
              {...register('amount', {
                setValueAs: value => {
                  const parsedValue = value.replaceAll(/[, \s]+/g, '')
                  return isNaN(parsedValue) ? 0 : parsedValue
                },
              })}
            />
          </div>
          <div className="col-span-1 flex flex-col justify-between">
            <Button onClick={handleSendClick} loading={sendLoading} disabled={sendLoading || loading || verification?.isVerified}>
              Send
            </Button>
            <div className={classNames(errors.amount && 'mb-6')}>
              <Button type="submit" loading={isSubmitting} disabled={isSubmitting || loading || !verification}>
                Verify
              </Button>
            </div>
          </div>
        </form>
      </div>
      {canSkipVerify && (
        <div className="flex flex-col space-y-1">
          <p className="text-sm leading-5 font-medium text-gray-700">I prefer not to verify my wallet address</p>
          <div className="grid grid-cols-4 border border-gray-200 rounded-md py-3 px-3 space-x-4">
            <p className="col-span-3 text-sm leading-5 text-gray-500">
              You may skip the verification step if you have difficulties verifying your address (e.g. you are using an exchange address).
              Please make sure the address you entered is correct, or your tokens will be lost.
            </p>

            <div className="col-span-1">
              <Button onClick={handleSkipClick} disabled={loading}>
                Skip
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="w-2/4">
        <Button variant="outline" onClick={onCancelClick}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

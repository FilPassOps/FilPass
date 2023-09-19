import { useAuth } from 'components/Authentication/Provider'
import { Modal } from 'components/shared/Modal'
import { useMetaMask } from 'components/web3/MetaMaskProvider'
import { api } from 'lib/api'
import { useCallback, useEffect, useState } from 'react'
import { getChain } from 'system.config'
import { AlertSkipStep } from './AlertSkipStep'
import { ChainSelection } from './ChainSelectionStep'
import { ConnectStep } from './ConnectStep'
import { NotificationStep } from './NotificationStep'
import { VerifyEthereumStep } from './VerifyEthereumStep'

interface WalletModalProps {
  open: boolean
  onModalClosed: () => void
  setUserWalletId: (id: number) => void
  blockchain: string
}

export function WalletModal({ open, onModalClosed, setUserWalletId }: WalletModalProps) {
  const { wallet, chainId } = useMetaMask()

  const { refresh, user } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<any>({})

  // TODO: the chainId, wallet, or the user can return null/undefined?

  const chain = getChain(chainId as string)

  const handleChainSelectionClick = () => {
    setStep(curr => curr + 1)
  }

  const handleNextStepClick = (stepData: any) => {
    setForm(stepData)
    setStep(curr => curr + 1)
  }

  const handlePreviousStepClick = () => {
    setStep(curr => curr + -1)
  }

  const handleModalClosed = () => {
    onModalClosed()
    refresh()
  }

  const resetStep = () => {
    setTimeout(() => setStep(1), 300)
  }

  useEffect(() => {
    if (!open && step !== 1) {
      resetStep()
    }
  }, [open, step])

  const showConfirmationStep = (step === 4 && !form?.skipAlert) || (step === 5 && form?.skipAlert)

  const createWallet = useCallback(
    async (values: any) => {
      const hasDefaultWallet = user?.wallets?.find(wallet => wallet.isDefault)
      return await api.post('/wallets', { ...values, isDefault: !hasDefaultWallet })
    },
    [user?.wallets],
  )

  return (
    <Modal open={open} onModalClosed={handleModalClosed}>
      {step === 1 && <ChainSelection onConnectionMethodClick={handleChainSelectionClick} />}

      {step === 2 && (
        <ConnectStep
          onBackClick={handlePreviousStepClick}
          onNextStepClick={handleNextStepClick}
          blockchainName={chain?.name}
          wallet={wallet as string}
          key={wallet}
        />
      )}

      {step === 3 && (
        <VerifyEthereumStep
          onNextStepClick={handleNextStepClick}
          onBackClick={handlePreviousStepClick}
          formData={form}
          setUserWalletId={setUserWalletId}
          networkName={chain?.networkName}
        />
      )}

      {step === 4 && form?.skipAlert && (
        <AlertSkipStep
          onNextStepClick={handleNextStepClick}
          formData={form}
          setUserWalletId={setUserWalletId}
          onBackClick={handlePreviousStepClick}
          createWallet={createWallet}
        />
      )}

      {showConfirmationStep && user && <NotificationStep onCloseClick={handleModalClosed} address={user.email} />}
    </Modal>
  )
}

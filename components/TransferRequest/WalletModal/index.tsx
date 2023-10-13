import { useAuth } from 'components/Authentication/Provider'
import { Modal } from 'components/Shared/Modal'
import { useMetaMask } from 'components/Web3-tmp/MetaMaskProvider'
import { AppConfig, ChainIds } from 'config'
import { useEffect, useState } from 'react'
import { ChainSelection } from './ChainSelectionStep'
import { ConnectStep } from './ConnectStep'
import { NotificationStep } from './NotificationStep'
import { VerifyEthereumStep } from './VerifyEthereumStep'

interface WalletModalProps {
  open: boolean
  onModalClosed: () => void
  setUserWalletId: (id: number) => void
  chainIdFilter?: string
}

export function WalletModal({ open, onModalClosed, setUserWalletId, chainIdFilter }: WalletModalProps) {
  const { wallet, chainId } = useMetaMask()

  const { refresh, user } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<any>({})

  const chain = AppConfig.network.getChain(chainId as ChainIds)

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

  const showConfirmationStep = step === 4 && !form?.skipAlert

  return (
    <Modal open={open} onModalClosed={handleModalClosed}>
      {step === 1 && <ChainSelection onConnectionMethodClick={handleChainSelectionClick} chainIdFilter={chainIdFilter} />}

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

      {showConfirmationStep && user && <NotificationStep onCloseClick={handleModalClosed} address={user.email} />}
    </Modal>
  )
}

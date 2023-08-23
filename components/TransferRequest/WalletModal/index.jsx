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
import { VerifyStep } from './VerifyStep'

export function WalletModal({ open, onModalClosed, setUserWalletId, blockchain }) {
  const { wallet, connect, chainId } = useMetaMask()

  const { refresh, user } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({})
  const [connectionMethod, setConnectionMethod] = useState()

  const chain = getChain(chainId)

  const handleChainSelectionClick = method => {
    setConnectionMethod(method)
    if (method === 'Metamask') {
      connect()
    }
    setStep(curr => curr + 1)
  }

  const handleNextStepClick = stepData => {
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
    async values => {
      const hasDefaultWallet = user?.wallets?.find(wallet => wallet.isDefault)
      return await api.post('/wallets', { ...values, isDefault: !hasDefaultWallet })
    },
    [user?.wallets],
  )

  return (
    <Modal open={open} onModalClosed={handleModalClosed}>
      {step === 1 && (
        <ChainSelection onCancelClick={handleModalClosed} onConnectionMethodClick={handleChainSelectionClick} blockchain={blockchain} />
      )}

      {step === 2 && (
        <ConnectStep
          onBackClick={handlePreviousStepClick}
          onNextStepClick={handleNextStepClick}
          connectionMethod={connectionMethod}
          blockchainName={chain?.name}
          wallet={wallet}
          key={wallet}
        />
      )}

      {step === 3 &&
        (connectionMethod === 'Metamask' ? (
          <VerifyEthereumStep
            onNextStepClick={handleNextStepClick}
            onBackClick={handlePreviousStepClick}
            formData={form}
            setUserWalletId={setUserWalletId}
            networkName={chain?.networkName}
          />
        ) : (
          <VerifyStep
            onNextStepClick={handleNextStepClick}
            onCancelClick={handleModalClosed}
            formData={form}
            setUserWalletId={setUserWalletId}
            createWallet={createWallet}
          />
        ))}

      {step === 4 && form?.skipAlert && (
        <AlertSkipStep
          onNextStepClick={handleNextStepClick}
          formData={form}
          setUserWalletId={setUserWalletId}
          onBackClick={handlePreviousStepClick}
          createWallet={createWallet}
        />
      )}

      {showConfirmationStep && <NotificationStep onCloseClick={handleModalClosed} address={user.email} />}
    </Modal>
  )
}

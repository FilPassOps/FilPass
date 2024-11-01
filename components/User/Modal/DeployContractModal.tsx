import { Modal } from 'components/Shared/Modal'
import { api } from 'lib/api'
import { useState } from 'react'

import { useRouter } from 'next/router'
import { useMetaMask, WithMetaMaskButton } from 'components/Web3/MetaMaskProvider'
import { AppConfig } from 'config/system'
import React from 'react'
import { useContract } from 'components/Web3/useContract'
import { getPaymentErrorMessage } from 'components/Web3/utils'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from 'components/Shared/Button'
import { TextInput } from 'components/Shared/FormInput'
import { Wallet } from '../WalletList'

const { network } = AppConfig.network.getFilecoin()

interface DeployContractModalProps {
  onModalClosed: () => void
  open: boolean
  contractAddress: string | null
  wallets: Wallet[] | null
}

export const DeployContractModal = ({ onModalClosed, open, contractAddress, wallets }: DeployContractModalProps) => {
  const [error, setError] = useState<any>()
  const [success, setSuccess] = useState<boolean>(false)
  const [contractDeployedError, setContractDeployedError] = useState<{ message: string } | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const { deployContract } = useContract(contractAddress)
  const { wallet } = useMetaMask()
  const router = useRouter()

  const handleFormSubmit = async () => {
    try {
      if (!wallets || wallets.length === 0) {
        setContractDeployedError({
          message: `You have no wallets registered. Please register a wallet on Profile & Settings first.`,
        })
        return
      }

      const existingWallet = wallets?.find(userWallet => userWallet.address === wallet)

      if (!existingWallet) {
        setContractDeployedError({
          message: `Use the same wallet address as the one on Profile & Settings.`,
        })
        return
      }

      const contract = await deployContract()

      await api.post('/contracts/deploy', {
        walletAddress: wallet,
        hash: contract.deployTransaction.hash,
      })

      setTransactionHash(contract.deployTransaction.hash)

      setSuccess(true)
    } catch (error: any) {
      setError(getPaymentErrorMessage(error))
    }
  }

  const handleCloseModal = () => {
    setError(null)
    setSuccess(false)
    onModalClosed()

    if (success) {
      router.reload()
    }
  }

  return (
    <Modal open={open} onModalClosed={handleCloseModal}>
      {success && <SuccessContent transactionHash={transactionHash} onClose={handleCloseModal} />}
      {error && <ErrorTransactionContent error={error} onClose={handleCloseModal} />}
      {!success && !error && (
        <DeployContractContent onDeploy={handleFormSubmit} wallet={wallet || ''} contractDeployedError={contractDeployedError} />
      )}
    </Modal>
  )
}

const SuccessContent: React.FC<{ transactionHash: string | null; onClose: () => void }> = ({ transactionHash, onClose }) => (
  <div className="flex flex-col items-center space-y-6 text-center">
    <div className="flex flex-col justify-center items-center">
      <span className="rounded-full w-14 h-14 flex justify-center items-center bg-green-100">
        <CheckIcon className="h-7 w-7 text-green-500" />
      </span>
    </div>
    <h1 className="my-2 font-medium text-lg leading-6 text-center">Contract Deployment Transaction Sent</h1>
    <p className="text-sm leading-5 text-gray-500">
      Your contract is being deployed. You can check the status of the deployment in the following link.
    </p>
    <a
      href={`${network?.blockExplorer.url}/${transactionHash}`}
      onClick={onClose}
      rel="noreferrer"
      target="_blank"
      className="underline text-green-700"
    >
      Check the transaction
    </a>
  </div>
)

const DeployContractContent: React.FC<{
  onDeploy: () => Promise<void>
  wallet: string | null
  contractDeployedError: { message: string } | null
}> = ({ onDeploy, wallet, contractDeployedError }) => (
  <div className="w-full h-full flex flex-col justify-center items-center space-y-6 sm:px-11">
    <p className="font-medium text-lg text-gray-900 text-center">Deploy Your Contract</p>
    <p className="text-gray-500 text-sm text-center">
      To start using the platform, first you need to deploy your contract. Remember to carefully select your wallet on MetaMask before
      deploying the contract.
    </p>

    <form className="w-full h-full space-y-8">
      <TextInput
        label="MetaMask Wallet"
        id="metaMaskWallet"
        type="text"
        disabled={true}
        value={wallet || '-'}
        error={contractDeployedError}
      />
      <WithMetaMaskButton targetChainId={network.chainId} onClick={onDeploy}>
        Deploy Contract
      </WithMetaMaskButton>
    </form>
  </div>
)

const ErrorTransactionContent: React.FC<{ error: string; onClose: () => void }> = ({ error, onClose }) => {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="flex flex-col justify-center items-center">
        <span className="rounded-full w-14 h-14 flex justify-center items-center bg-red-100">
          <XMarkIcon className="h-7 w-7 text-red-500" />
        </span>
      </div>
      <h1 className="my-2 font-medium text-lg leading-6 text-center">Contract Deployment Transaction Failed</h1>
      <p className="text-sm leading-5 text-gray-500">{error}</p>

      <Button className="w-fit" onClick={onClose}>
        Close
      </Button>
    </div>
  )
}

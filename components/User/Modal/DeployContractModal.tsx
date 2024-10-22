import { Modal } from 'components/Shared/Modal'
import { api } from 'lib/api'
import { useState } from 'react'

import { useRouter } from 'next/router'
import { useMetaMask, WithMetaMaskButton } from 'components/Web3/MetaMaskProvider'
import { AppConfig } from 'config/system'
import React from 'react'
import { useContract } from 'components/Web3/useContract'
import { getPaymentErrorMessage } from 'components/Web3/utils'
import { CheckIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { DeployContractTransaction } from '@prisma/client'
import { Button } from 'components/Shared/Button'

const token = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')
const network = AppConfig.network.getChainByToken(token)!

interface DeployContractModalProps {
  onModalClosed: () => void
  open: boolean
  contractAddress: string | null
  pendingContractTransactions: DeployContractTransaction[] | null
}

export const DeployContractModal = ({ onModalClosed, open, contractAddress, pendingContractTransactions }: DeployContractModalProps) => {
  const [error, setError] = useState<any>()
  const [success, setSuccess] = useState<boolean>(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const { deployContract } = useContract(contractAddress)
  const { wallet } = useMetaMask()
  const router = useRouter()

  const pendingTransaction = pendingContractTransactions && pendingContractTransactions.length > 0 ? pendingContractTransactions[0] : null

  const handleFormSubmit = async () => {
    try {
      const contract = await deployContract()

      const result = await api.post('/contracts/deploy', {
        walletAddress: wallet,
        hash: contract.deployTransaction.hash,
      })

      console.log(result)

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
    router.reload()
  }

  return (
    <Modal open={open} onModalClosed={handleCloseModal}>
      {success && <SuccessContent transactionHash={transactionHash} onClose={handleCloseModal} />}
      {error && <ErrorTransactionContent error={error} onClose={handleCloseModal} />}
      {!success &&
        !error &&
        (pendingTransaction ? (
          <PendingTransactionContent transactionHash={pendingTransaction.transactionHash} onClose={handleCloseModal} />
        ) : (
          <DeployContractContent onDeploy={handleFormSubmit} />
        ))}
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

const PendingTransactionContent: React.FC<{ transactionHash: string; onClose: () => void }> = ({ transactionHash, onClose }) => (
  <div className="flex flex-col items-center space-y-6 text-center">
    <div className="flex flex-col justify-center items-center">
      <span className="rounded-full w-14 h-14 flex justify-center items-center bg-yellow-100">
        <ExclamationTriangleIcon className="h-7 w-7 text-yellow-600" />
      </span>
    </div>
    <h1 className="my-2 font-medium text-lg leading-6 text-center">Contract Deployment Transaction in Progress</h1>
    <p className="text-sm leading-5 text-gray-500">You can check the status of the deployment in the following link.</p>
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

const DeployContractContent: React.FC<{ onDeploy: () => Promise<void> }> = ({ onDeploy }) => (
  <div className="space-y-9 text-center">
    <h2 className="text-gray-900 text-lg font-medium">Deploy Your Contract</h2>
    <p className="text-gray-500 text-sm">
      To start using the platform, first you need to deploy your contract. Remember to carefully select your MetaMask wallet before
      deploying the contract.
    </p>
    <div className="flex space-x-3 items-center justify-center">
      <WithMetaMaskButton targetChainId={network.chainId} onClick={onDeploy}>
        Deploy Contract
      </WithMetaMaskButton>
    </div>
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

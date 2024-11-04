import { useEffect, useState } from 'react'
import { CustomWindow, useMetaMask } from './MetaMaskProvider'
import {
  FilecoinDepositWithdrawRefund,
  FilecoinDepositWithdrawRefund__factory as FilecoinDepositWithdrawRefundFactory,
} from 'typechain-types'
import { ethers } from 'ethers'
import { AppConfig } from 'config/system'
import { ExternalProvider } from '@ethersproject/providers'

declare const window: CustomWindow

export const useContract = (contractAddress: string | null) => {
  const { chainId, wallet, setBusy } = useMetaMask()
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>()
  const [filpass, setFilpass] = useState<FilecoinDepositWithdrawRefund>()

  const { network } = AppConfig.network.getFilecoin()

  const connectedToTargetChain = wallet && chainId === network.chainId

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider)
    const signer = provider.getSigner()

    if (contractAddress) {
      const filpass = FilecoinDepositWithdrawRefundFactory.connect(contractAddress, signer)
      setFilpass(filpass)
    }

    setSigner(signer)
    setProvider(provider)

    return () => {
      filpass?.removeAllListeners()
    }
  }, [contractAddress])

  const depositAmount = async (oracleAddress: string, recipientAddress: string, lockUpTime: number, amount: string) => {
    if (!filpass || !signer || !provider || !oracleAddress || !recipientAddress || !lockUpTime || !amount) {
      throw new Error('Missing dependencies')
    }

    if (!connectedToTargetChain) {
      throw new Error('Not connected to target chain')
    }

    try {
      setBusy(true)
      const weiAmount = ethers.utils.parseEther(amount)
      return await filpass.depositAmount(oracleAddress, recipientAddress, lockUpTime, { value: weiAmount })
    } catch (error) {
      console.error('Error depositing amount', error)
      throw error
    } finally {
      setBusy(false)
    }
  }

  const refundAmount = async (oracleAddress: string, recipientAddress: string) => {
    if (!filpass || !signer || !provider || !oracleAddress || !recipientAddress) {
      throw new Error('Missing dependencies')
    }

    if (!connectedToTargetChain) {
      throw new Error('Not connected to target chain')
    }

    try {
      setBusy(true)
      return await filpass.refundAmount(oracleAddress, recipientAddress)
    } catch (error: any) {
      console.error('Error refunding amount', error)
      throw error
    } finally {
      setBusy(false)
    }
  }

  const deployContract = async () => {
    if (!signer || !provider) {
      throw new Error('Missing dependencies')
    }

    try {
      setBusy(true)
      const factory = new FilecoinDepositWithdrawRefundFactory(signer)
      const contract = await factory.deploy()
      return contract
    } catch (error: any) {
      console.error('Error deploying contract', error)
      throw error
    } finally {
      setBusy(false)
    }
  }

  return { depositAmount, refundAmount, deployContract }
}

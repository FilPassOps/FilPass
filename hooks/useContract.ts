import { CustomWindow, useMetaMask } from '../components/Web3-tmp/MetaMaskProvider'

import { ExternalProvider } from '@ethersproject/providers'
import { AppConfig, ChainNames } from 'config'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { MultiForwarder, MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'

declare const window: CustomWindow

export const contractInterface = MultiForwarderFactory.createInterface()

export const useContract = (blockchainName: string) => {
  const { chainId, wallet, setBusy } = useMetaMask()
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>()
  const [multiForwarder, setMultiForwarder] = useState<MultiForwarder>()

  const { getChainByName } = AppConfig.network

  const chain = getChainByName(blockchainName as ChainNames)

  const connectedToTargetChain = wallet && chainId === chain.chainId

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider)
    const signer = provider.getSigner()
    const multiForwarder = MultiForwarderFactory.connect(chain.contractAddress, signer)

    setSigner(signer)
    setProvider(provider)
    setMultiForwarder(multiForwarder)

    return () => {
      multiForwarder.removeAllListeners()
    }
  }, [chain.contractAddress])

  /**
   * Forward FIL to up to 100 addresses
   * @param destinations array of addresses (f1/2/4 0x) - DO NOT USE f3 ADDRESSES
   * @param amounts array of amounts in FIL
   * @throws if dependencies are not set / if the transaction fails
   * @returns
   */
  const forward = async (blockchainName: string, id: string, destinations: string[], amounts: string[]) => {
    //TODO OPEN-SOURCE: use the blockchainName from the props
    if (!multiForwarder || !signer || !provider || !destinations || !amounts) {
      throw new Error('Missing dependencies')
    }

    if (!connectedToTargetChain) {
      throw new Error('Not connected to target chain')
    }

    try {
      setBusy(true)
      const weiValues = amounts.map(amount => ethers.utils.parseEther(amount))
      const weiTotal = weiValues.reduce((a, b) => a.add(b), ethers.BigNumber.from(0))

      return await multiForwarder.forward(id, destinations, weiValues, { value: weiTotal })
    } finally {
      setBusy(false)
    }
  }

  return { forward }
}

export type Forward = ReturnType<typeof useContract>['forward']

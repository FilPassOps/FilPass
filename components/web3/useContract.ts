import { CustomWindow, useMetaMask } from './MetaMaskProvider'

import { ExternalProvider } from '@ethersproject/providers'
import filecoinAddress from '@glif/filecoin-address'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { MultiForwarder, MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'
import config from '../../chains.config'

declare const window: CustomWindow

export const contractInterface = MultiForwarderFactory.createInterface()

export const useContract = () => {
  const { chainId, wallet, setBusy } = useMetaMask()
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>()
  const [multiForwarder, setMultiForwarder] = useState<MultiForwarder>()

  const connectedToTargetChain = wallet && chainId === config.chain.chainId

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider)
    const signer = provider.getSigner()
    const multiForwarder = MultiForwarderFactory.connect(config.multiforwarder, signer)

    setSigner(signer)
    setProvider(provider)
    setMultiForwarder(multiForwarder)

    return () => {
      multiForwarder.removeAllListeners()
    }
  }, [])

  /**
   * Forward FIL to up to 45 addresses of any type
   * @param destinations array of addresses (f1/2/3/4 0x addresses will be converted to f4 addresses)
   * @param amounts array of amounts in FIL
   * @throws if dependencies are not set / if the transaction fails
   * @returns
   */
  const forwardAny = async (id: string, destinations: string[], amounts: string[]) => {
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

      const addresses = destinations.map(destination => {
        let address = destination
        if (destination.startsWith('0x')) {
          address = filecoinAddress.delegatedFromEthAddress(destination, config.coinType)
        }
        return filecoinAddress.newFromString(address).bytes
      })

      return await multiForwarder.forwardAny(id, addresses, weiValues, { value: weiTotal })
    } finally {
      setBusy(false)
    }
  }

  /**
   * Forward FIL to up to 100 `32 bytes` addresses
   * @param destinations array of addresses (f1/2/4 0x) - DO NOT USE f3 ADDRESSES
   * @param amounts array of amounts in FIL
   * @throws if dependencies are not set / if the transaction fails
   * @returns
   */
  const forward = async (id: string, destinations: string[], amounts: string[]) => {
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

      const addresses = destinations.map(destination => {
        let address = destination
        if (destination.startsWith('0x')) {
          address = filecoinAddress.delegatedFromEthAddress(destination, config.coinType)
        }
        const bytes = filecoinAddress.newFromString(address).bytes
        const paddedAddress = new Uint8Array(32)
        paddedAddress.set(bytes)
        paddedAddress.fill(0, bytes.length, 32)
        return paddedAddress
      })

      return await multiForwarder.forward(id, addresses, weiValues, { value: weiTotal })
    } finally {
      setBusy(false)
    }
  }

  return { forwardAll: forwardAny, forwardNonBLS: forward }
}

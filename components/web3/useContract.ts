import { CustomWindow, useMetaMask } from './MetaMaskProvider'

import { ExternalProvider } from '@ethersproject/providers'
import filecoinAddress, { CoinType } from '@glif/filecoin-address'
import { AppConfig, ChainNames } from 'config'
import { FilecoinChain } from 'config/chains'
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

  const chain = AppConfig.network.getChainByName(blockchainName as ChainNames)

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
   * Forward FIL to up to 100 `32 bytes` addresses
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

      const addresses = destinations.map(destination => {
        if (blockchainName !== 'Filecoin') {
          const bytes = ethers.utils.arrayify(destination)
          return zeroPad(bytes)
        }

        let address = destination
        if (destination.startsWith('0x')) {
          const chain = AppConfig.network.getChainByName(blockchainName) as FilecoinChain

          address = filecoinAddress.delegatedFromEthAddress(destination, chain.coinType as CoinType)
        }
        const bytes = filecoinAddress.newFromString(address).bytes
        return zeroPad(bytes)
      })

      return await multiForwarder.forward(id, addresses, weiValues, { value: weiTotal })
    } finally {
      setBusy(false)
    }
  }

  return { forwardNonBLS: forward }
}

export type ForwardNonBLS = ReturnType<typeof useContract>['forwardNonBLS']

function zeroPad(bytes: Uint8Array) {
  const paddedAddress = new Uint8Array(32)
  paddedAddress.set(bytes)
  paddedAddress.fill(0, bytes.length, 32)
  return paddedAddress
}

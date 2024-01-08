import { CustomWindow, useMetaMask } from '../components/Web3/MetaMaskProvider'

import { ExternalProvider } from '@ethersproject/providers'
import { AppConfig, ERC20Token, NativeToken, isERC20Token } from 'config'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { ERC20, ERC20__factory as ERC20Factory, MultiForwarder, MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'

declare const window: CustomWindow

export const contractInterface = MultiForwarderFactory.createInterface()

export const useContract = (token: ERC20Token | NativeToken) => {
  const chain = AppConfig.network.getChainByToken(token)

  if (!chain) {
    throw new Error('Chain not found')
  }

  const { chainId, wallet, setBusy } = useMetaMask()
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>()
  const [multiForwarder, setMultiForwarder] = useState<MultiForwarder>()
  const [erc20, setErc20] = useState<ERC20>()
  const [loadingAllowance, setLoadingAllowance] = useState<boolean>(false)

  const connectedToTargetChain = wallet && chainId === chain.chainId

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider)
    const signer = provider.getSigner()
    const multiForwarder = MultiForwarderFactory.connect(chain.contractAddress, signer)

    setSigner(signer)
    setProvider(provider)
    setMultiForwarder(multiForwarder)

    if (isERC20Token(token)) {
      const erc20 = ERC20Factory.connect(token.erc20TokenAddress, signer)
      setErc20(erc20)
    }

    return () => {
      multiForwarder.removeAllListeners()
    }
  }, [chain.contractAddress, token])

  /**
   * Forward to up to 100 addresses
   * @param destinations array of addresses
   * @param amounts array of amounts
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
      const unitValues = amounts.map(amount => ethers.utils.parseUnits(amount, token.decimals))
      const weiTotal = weiValues.reduce((a, b) => a.add(b), ethers.BigNumber.from(0))
      const unitTotal = unitValues.reduce((a, b) => a.add(b), ethers.BigNumber.from(0))

      if (isERC20Token(token) && erc20) {
        const approveResult = await erc20.approve(multiForwarder.address, unitTotal)

        setLoadingAllowance(true)
        await provider.waitForTransaction(approveResult.hash)
        setLoadingAllowance(false)

        return await multiForwarder.forwardERC20(id, destinations, unitValues, erc20.address)
      }

      return await multiForwarder.forward(id, destinations, weiValues, { value: weiTotal })
    } catch (error) {
      console.error(error)
    } finally {
      setBusy(false)
    }
  }

  return { forward, loadingAllowance }
}

export type Forward = ReturnType<typeof useContract>['forward']

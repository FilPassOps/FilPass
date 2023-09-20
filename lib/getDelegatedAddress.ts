import fa, { Address, CoinType } from '@glif/filecoin-address'
import { ethers } from 'ethers'
import { FilecoinChain, getChainByName } from 'system.config'

export enum WalletSize {
  FULL = 20,
  SHORT = 12,
  VERY_SHORT = 6,
}

export const getDelegatedAddress = (walletAddress?: string, walletSize: WalletSize = WalletSize.SHORT, chainName?: string) => {
  if (walletAddress?.startsWith('0x') && walletAddress.length === 42 && chainName === 'Filecoin') {
    try {
      const filecoin = getChainByName('Filecoin') as FilecoinChain

      const delegatedAddress = fa.delegatedFromEthAddress(walletAddress, filecoin.coinType as CoinType)
      if (!delegatedAddress) return { fullAddress: '', shortAddress: '' }

      return {
        fullAddress: delegatedAddress,
        shortAddress: `${delegatedAddress.substring(0, walletSize)}...${delegatedAddress.substring(delegatedAddress.length - walletSize)}`,
      }
    } catch (e) {
      console.error(e)
      return { fullAddress: '', shortAddress: '' }
    }
  }
  return { fullAddress: '', shortAddress: '' }
}

export const hexAddressDecoder = (chainName: string, address: string) => {
  if (chainName !== 'Filecoin') {
    return ethers.utils.hexDataSlice(address, 0, 20)
  }

  const buff = Buffer.from(address.substring(2), 'hex')
  let size = buff.length
  if (buff[0] == 0x01 || buff[0] == 0x02) {
    size = 21
  } else if (buff[0] == 0x03) {
    size = 49
  } else if (buff[0] == 0x04) {
    size = 22
  }

  const filecoin = getChainByName('Filecoin') as FilecoinChain

  return new Address(buff.subarray(0, size), filecoin.coinType as CoinType).toString()
}

export const amountConverter = (amount: ethers.BigNumber) => ethers.utils.formatEther(ethers.BigNumber.from(amount))

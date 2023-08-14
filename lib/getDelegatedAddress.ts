import fa, { Address } from '@glif/filecoin-address'
import { WalletSize } from 'components/web3/useDelegatedAddress'
import { ethers } from 'ethers'
import { TOKEN } from 'system.config'
import config from '../chains.config'

export const getDelegatedAddress = (walletAddress?: string, walletSize: WalletSize = WalletSize.SHORT) => {
  if (walletAddress?.startsWith('0x') && walletAddress.length === 42) {
    try {
      const delegatedAddress = fa.delegatedFromEthAddress(walletAddress, config.coinType)
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

export const hexAddressDecoder = (address: string) => {
  if (TOKEN.name !== 'Filecoin') {
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
  return new Address(buff.subarray(0, size), config.coinType).toString()
}

export const amountConverter = (amount: ethers.BigNumber) => ethers.utils.formatEther(ethers.BigNumber.from(amount))

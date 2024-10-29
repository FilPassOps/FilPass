import { utils } from 'ethers'
import fa from '@glif/filecoin-address'

export const validateWalletAddress = (address: string) => {
  try {
    if (address?.startsWith('f4') || address?.startsWith('t4')) {
      const ethAddress = fa.ethAddressFromDelegated(address)
      if (!ethAddress) return null
      return ethAddress
    } else if (address?.startsWith('0x')) {
      const isAddress = utils.isAddress(address)
      if (!isAddress) return null
      return address
    } else {
      return null
    }
  } catch (e) {
    return null
  }
}

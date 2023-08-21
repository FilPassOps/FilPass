import { ethers } from 'ethers'
import { TOKEN } from 'system.config'
import { matchWalletAddress, validateWalletAddress } from './filecoinShipyard'

export const matchtAddress = async (address: string) => {
  if (TOKEN.name !== 'Filecoin') {
    return !!validateAddress(address)
  }
  return matchWalletAddress(address)
}

export const validateAddress = async (address: string) => {
  if (TOKEN.name !== 'Filecoin') {
    if (ethers.utils.isAddress(address)) {
      return address
    } else {
      throw new Error('Invalid address')
    }
  }
  return validateWalletAddress(address)
}

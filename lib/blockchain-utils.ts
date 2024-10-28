import { utils } from 'ethers'

export const validateWalletAddress = (address: string) => {
  return utils.isAddress(address)
}

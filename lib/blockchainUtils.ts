import { utils } from 'ethers'

export const validateWalletAddress = async (address: string) => {
  return utils.isAddress(address)
}

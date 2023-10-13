import { ethers, utils } from 'ethers'

export const validateWalletAddress = (address: string) => {
  return utils.isAddress(address)
}

export const amountConverter = (amount: ethers.BigNumber) => ethers.utils.formatEther(ethers.BigNumber.from(amount))

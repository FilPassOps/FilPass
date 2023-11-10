import { Chain } from 'config/chains'
import { ethers, utils } from 'ethers'

export const validateWalletAddress = (address: string) => {
  return utils.isAddress(address)
}

export const amountConverter = (amount: ethers.BigNumber) => ethers.utils.formatEther(ethers.BigNumber.from(amount))

export async function getBalance(walletAddress: string, chain: Chain) {
  const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])
  const balance = await provider.getBalance(walletAddress)
  return amountConverter(balance)
}

import { ERC20Token, NativeToken, isERC20Token } from 'config/chains'
import { AppConfig } from 'config/system'
import { ethers, utils } from 'ethers'
import { ERC20__factory as ERC20Factory } from 'typechain-types'

export const validateWalletAddress = (address: string) => {
  return utils.isAddress(address)
}

export const amountConverter = (amount: ethers.BigNumber, decimals: number) => ethers.utils.formatUnits(String(amount), decimals)

export async function getBalance(walletAddress: string, token: ERC20Token | NativeToken) {
  const chain = AppConfig.network.getChainByToken(token)
  if (!chain) {
    throw new Error('Chain not found')
  }
  const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])

  if (isERC20Token(token)) {
    const signer = provider.getSigner(walletAddress)
    const erc20 = ERC20Factory.connect(token.erc20TokenAddress, signer)
    const balance = await erc20.balanceOf(walletAddress)
    return ethers.utils.formatUnits(balance, token.decimals)
  }

  const balance = await provider.getBalance(walletAddress)
  return ethers.utils.formatUnits(balance, token.decimals)
}

import fa, { Address, CoinType } from '@glif/filecoin-address'
import { ethers } from 'ethers'
import { AppConfig, ChainNames } from 'system.config'

export const getFilecoinDelegatedAddress = (walletAddress: string, coinType: CoinType) => {
  return fa.delegatedFromEthAddress(walletAddress, coinType) as Lowercase<string>
}

export const hexAddressDecoder = (chainName: string, address: string) => {
  const { getChainByName, isFilecoin } = AppConfig.network
  const chain = getChainByName(chainName as ChainNames)

  if (!isFilecoin(chain)) {
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

  return new Address(buff.subarray(0, size), chain.coinType as CoinType).toString()
}

export const amountConverter = (amount: ethers.BigNumber) => ethers.utils.formatEther(ethers.BigNumber.from(amount))

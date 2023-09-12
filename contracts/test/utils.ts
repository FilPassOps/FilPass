import { JsonRpcProvider } from '@ethersproject/providers'
import filecoinAddress from '@glif/filecoin-address'
import { ethers } from 'hardhat'
import { MultiForwarder } from 'typechain-types'
import { testnet } from '../../chains.config'
import config from '../../hardhat.config'

export const TEST_ADDRESS_T0 = 't024550'
export const TEST_ADDRESS_T1 = 't1d6udrjruc3iqhyhrd2rjnjkhzsa6gd6tb63oi6i'
export const TEST_ADDRESS_T2 = 't2blsdlkvh26a7beg4e4tjdnd7x3lk6qybjnql73a'
export const TEST_ADDRESS_T3 = 't3vzc7naq3khx3bjkbelvce2yw4brl5bw4ejjhrcdoh63qma66elz26fxkmayl2qtvte7dzgod6qc3ou2j676a'
export const TEST_ADDRESS_T4 = 't410f3oxy7m2e3hsx772imwne5nyyysakd7lcvtu67ba'

export const DEFAULT_TIMEOUT = 4 * 60 * 1000
export const PADDED_WALLET_SIZE = 32
export const UNIQUE_ID = 'unique-generate-id'

export const getProvider = () => new ethers.providers.JsonRpcProvider(config.networks.calibration.url)
export const getContract = async () => {
  return (await ethers.getContractAt('contracts/MultiForwarder.sol:MultiForwarder', testnet.multiforwarder)) as MultiForwarder
}
export const getBalance = async (address: string, provider: JsonRpcProvider) => {
  return ethers.utils.parseUnits(await provider.send('Filecoin.WalletBalance', [address]), 'wei')
}
export const getPaddedAddress = (address: string) => {
  const filAddress = filecoinAddress.newFromString(address).bytes

  const paddedWallet = new Uint8Array(PADDED_WALLET_SIZE)
  paddedWallet.set(filAddress)
  paddedWallet.fill(0, address.length, PADDED_WALLET_SIZE)

  return paddedWallet
}

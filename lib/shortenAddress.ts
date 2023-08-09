import { WalletSize } from 'components/web3/useDelegatedAddress'

export function shortenAddress(address = '', walletSize: WalletSize = WalletSize.VERY_SHORT): string {
  return `${address.substring(0, walletSize)}...${address.substring(address.length - walletSize)}`
}

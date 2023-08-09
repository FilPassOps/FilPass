import fa from '@glif/filecoin-address'
import { WalletSize } from 'components/web3/useDelegatedAddress'

export const getEthereumAddress = (walletAddress?: string, walletSize: WalletSize = WalletSize.SHORT) => {
  if ((walletAddress?.startsWith('f4') || walletAddress?.startsWith('t4'))) {
    try {
      const ethAddress = fa.ethAddressFromDelegated(walletAddress)
      if (!ethAddress) return { fullAddress: '', shortAddress: '' }

      return {
        fullAddress: ethAddress,
        shortAddress: `${ethAddress.substring(0, walletSize)}...${ethAddress.substring(ethAddress.length - walletSize)}`,
      }
    } catch (e) {
      return { fullAddress: '', shortAddress: '' }
    }
  }
}

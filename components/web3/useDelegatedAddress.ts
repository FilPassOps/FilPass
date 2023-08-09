import fa from '@glif/filecoin-address'
import { useCallback } from 'react'
import config from '../../chains.config'

export enum WalletSize {
  FULL = 20,
  SHORT = 12,
  VERY_SHORT = 6,
}

export default function useDelegatedAddress() {
  const getDelegatedAddress = useCallback((walletAddress: string, walletSize: WalletSize = WalletSize.SHORT) => {
    if (walletAddress?.startsWith('0x') && walletAddress.length === 42) {
      try {
        const delegatedAddress = fa.delegatedFromEthAddress(walletAddress, config.coinType)
        if (!delegatedAddress) return { fullAddress: '', shortAddress: '' }

        return {
          fullAddress: delegatedAddress,
          shortAddress: `${delegatedAddress.substring(0, walletSize)}...${delegatedAddress.substring(
            delegatedAddress.length - walletSize
          )}`,
        }
      } catch (e) {
        return { fullAddress: '', shortAddress: '' }
      }
    }
  }, [])
  return getDelegatedAddress
}

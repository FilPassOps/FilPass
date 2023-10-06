import { classNames } from 'lib/classNames'
import { WalletSize } from 'lib/getDelegatedAddress'
import { shortenAddress } from 'lib/shortenAddress'
import { IsVerified } from './IsVerified'
import { BlockchainIcon } from './icons/BlockchainIcon'

interface WalletAddressProps {
  blockchain: string
  address: string
  isVerified?: boolean
  enableBlockchainIcon?: boolean
  enableVerifiedIcon?: boolean
  className?: string
  label?: string | null
  walletSize?: 'very-short' | 'short' | 'full'
}

export const WalletAddress = ({
  address,
  className = '',
  enableBlockchainIcon = true,
  enableVerifiedIcon = false,
  isVerified,
  label,
  blockchain,
  walletSize = 'very-short',
}: WalletAddressProps) => {
  const sizes = {
    'very-short': WalletSize.VERY_SHORT,
    short: WalletSize.SHORT,
    full: WalletSize.FULL,
  }

  const walletLength = sizes[walletSize]

  let formattedAddress = address

  if (walletLength !== WalletSize.FULL) {
    formattedAddress = shortenAddress(address, walletLength)
  }

  return (
    <div title={address} className={classNames('flex items-center text-sm text-gray-900', className)}>
      {enableBlockchainIcon && <BlockchainIcon blockchainName={blockchain} className="mr-2" />}
      <span className="flex flex-shrink-0 flex-col justify-center items-start">
        {blockchain && <p className="text-gray-500 ui-active:text-white truncate">{blockchain}</p>}
        <p className="text-gray-500 ui-active:text-white truncate">{label}</p>
        <p className="ui-active:text-white break-all">{formattedAddress}</p>
      </span>
      {enableVerifiedIcon && (
        <span title={isVerified ? 'Verified' : 'Unverified'} className="ml-2">
          <IsVerified isVerified={isVerified} showText={false} />{' '}
        </span>
      )}
    </div>
  )
}

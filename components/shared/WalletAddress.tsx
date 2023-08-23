import { classNames } from 'lib/classNames'
import { WalletSize, getDelegatedAddress } from 'lib/getDelegatedAddress'
import { shortenAddress } from 'lib/shortenAddress'
import { IsVerified } from './IsVerified'
import { FilecoinIcon } from './icons/chains/FilecoinIcon'

interface WalletAddressProps {
  blockchain: string
  address: string
  isVerified?: boolean
  enableBlockchainIcon?: boolean
  enableVerifiedIcon?: boolean
  className?: string
  delegatedAddress?: string
  label?: string
  walletSize?: 'very-short' | 'short' | 'full'
}

export const WalletAddress = ({
  address,
  className = '',
  enableBlockchainIcon = true,
  enableVerifiedIcon = true,
  isVerified,
  label,
  blockchain,
  delegatedAddress,
  walletSize = 'very-short',
}: WalletAddressProps) => {
  const sizes = {
    'very-short': WalletSize.VERY_SHORT,
    short: WalletSize.SHORT,
    full: WalletSize.FULL,
  }

  const walletLength = sizes[walletSize]

  let formattedAddress = address
  let filecoinDelegatedAddress = delegatedAddress

  if (!delegatedAddress && blockchain === 'Filecoin') {
    const delegatedAddressObj = getDelegatedAddress(address, walletLength)
    filecoinDelegatedAddress = walletLength === WalletSize.FULL ? delegatedAddressObj?.fullAddress : delegatedAddressObj?.shortAddress
  }
  if (walletLength !== WalletSize.FULL) {
    formattedAddress = shortenAddress(address, walletLength)
  }

  return (
    <div title={address} className={classNames('flex items-center text-sm text-gray-900', className)}>
      {enableBlockchainIcon && <FilecoinIcon className="w-4 h-4 mr-2 shrink-0" />}
      <span className="flex flex-col justify-center items-start">
        {blockchain && <p className="text-gray-500 ui-active:text-white truncate">{blockchain}</p>}
        <p className="text-gray-500 ui-active:text-white truncate">{label}</p>
        <p className="ui-active:text-white break-all">{formattedAddress}</p>
        {filecoinDelegatedAddress ? <p className="text-gray-500 ui-active:text-white break-all">{filecoinDelegatedAddress}</p> : ''}
      </span>
      {enableVerifiedIcon && (
        <span title={isVerified ? 'Verified' : 'Unverified'} className="ml-2">
          <IsVerified isVerified={isVerified} showText={false} />{' '}
        </span>
      )}
    </div>
  )
}

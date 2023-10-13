import { classNames } from 'lib/class-names'
import { ShortenLength, shortenAddress } from 'lib/shorten-address'
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
  shortenLength?: ShortenLength
}

export const WalletAddress = ({
  address,
  className = '',
  enableBlockchainIcon = true,
  enableVerifiedIcon = false,
  isVerified,
  label,
  blockchain,
  shortenLength,
}: WalletAddressProps) => {
  let formattedAddress = address

  if (shortenLength) {
    formattedAddress = shortenAddress(address, shortenLength)
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

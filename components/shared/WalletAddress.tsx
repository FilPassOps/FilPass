import { Blockchain } from '@prisma/client'
import { classNames } from 'lib/classNames'
import { FilecoinIcon } from './icons/chains/FilecoinIcon'
import { IsVerified } from './IsVerified'

interface WalletAddressProps {
  blockchain?: Blockchain
  address: string
  isVerified?: boolean
  enableBlockchainIcon?: boolean
  enableVerifiedIcon?: boolean
  className?: string
  delegatedAddress?: string
  label?: string | null
}

export const WalletAddress = ({
  address,
  className = '',
  enableBlockchainIcon = true,
  enableVerifiedIcon = true,
  delegatedAddress,
  isVerified,
  label,
}: WalletAddressProps) => {
  return (
    <div title={address} className={classNames('flex items-center text-sm text-gray-900', className)}>
      {enableBlockchainIcon && <FilecoinIcon className="w-4 h-4 mr-2 shrink-0" />}
      <span className="flex flex-col justify-center items-start">
        <p className="text-gray-500 ui-active:text-white truncate">{label}</p>
        <p className='ui-active:text-white break-all'>{address}</p>
        {delegatedAddress ? <p className="text-gray-500 ui-active:text-white break-all">{delegatedAddress}</p> : ''}
      </span>
      {enableVerifiedIcon && (
        <span title={isVerified ? 'Verified' : 'Unverified'} className="ml-2">
          <IsVerified isVerified={isVerified} showText={false} />{' '}
        </span>
      )}
    </div>
  )
}

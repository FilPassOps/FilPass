import { Blockchain } from '@prisma/client'
import { classNames } from 'lib/classNames'
import { FilecoinIcon } from './chains/FilecoinIcon'

interface BlockchainIconProps {
  blockchain: Blockchain
  className?: string
}

export const BlockchainIcon = ({ className }: BlockchainIconProps) => {
  return <FilecoinIcon className={classNames('w-4', className)} />
}

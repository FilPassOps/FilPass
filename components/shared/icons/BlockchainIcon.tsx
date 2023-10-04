import Image from 'next/image'
import { AppConfig, ChainNames } from 'system.config'
import { twMerge } from 'tailwind-merge'

interface BlockchainIconProps {
  blockchainName: string
  className?: string
  width?: number
  height?: number
}

export const BlockchainIcon = ({ className, blockchainName, height, width }: BlockchainIconProps) => {
  const blockchainIconFileName = AppConfig.network.getChainByName(blockchainName as ChainNames)?.iconFileName

  return (
    <Image
      src={`/blockchain-icons/${blockchainIconFileName}`}
      width={width || 20}
      height={height || 20}
      className={twMerge('shrink-0', className)}
      alt={`${blockchainName}-icon`}
      unoptimized
      priority
    />
  )
}

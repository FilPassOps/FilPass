import { AppConfig, TokenOptions } from 'config'
import Image from 'next/image'
import { twMerge } from 'tailwind-merge'

interface TokenIconProps {
  blockchainName: string
  tokenSymbol: TokenOptions
  className?: string
  width?: number
  height?: number
}

export const TokenIcon = ({ className, blockchainName, tokenSymbol, height, width }: TokenIconProps) => {
  const tokenIconFileName = AppConfig.network.getTokenBySymbolAndBlockchainName(tokenSymbol, blockchainName).iconFileName

  return (
    <Image
      src={`/token-icons/${tokenIconFileName}`}
      width={width || 20}
      height={height || 20}
      className={twMerge('shrink-0', className)}
      alt={`${blockchainName}-icon`}
      unoptimized
      priority
    />
  )
}

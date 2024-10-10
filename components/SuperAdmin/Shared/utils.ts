import { AppConfig, TokenOptions, isERC20Token } from 'config'

export const formatPaymentMethod = (request_unit_name?: string, payment_unit_name?: string) => {
  if (!request_unit_name && !payment_unit_name) {
    return '-'
  }

  if (!request_unit_name && payment_unit_name) {
    return payment_unit_name
  }

  return `Request in ${request_unit_name} and Pay in ${payment_unit_name}`
}

export const formatRequestPaymentToken = ({
  isUSD,
  blockchainName,
  tokenSymbol,
}: {
  isUSD: boolean
  blockchainName: string
  tokenSymbol: string
}) => {
  if (isUSD || !tokenSymbol || !blockchainName) {
    return undefined
  }

  const token = AppConfig.network.getTokenBySymbolAndBlockchainName(tokenSymbol as TokenOptions, blockchainName)
  const blockchain = AppConfig.network.getChainByToken(token)

  return isERC20Token(token) ? token.erc20TokenAddress : blockchain?.chainId
}

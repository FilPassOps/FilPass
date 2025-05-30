import chains, { Chain, Chains, ERC20Token, NativeToken, isERC20Token } from './chains'

export interface App {
  name: string
  companyName: string
  emailConfig: {
    domain: string
    fromName: string
    supportAddress: string
    logoUrl: string
    twitterIconUrl?: string
    linkedinIconUrl?: string
    youtubeIconUrl?: string
  }
  youtubeChannelUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
}

export interface AppConfig {
  app: App
  network: {
    fiatPaymentUnit: string
    chains: Chains
    getChain: (chainId: ChainIds) => Chain
    getChainByName: (blockchainName: ChainNames) => Chain
    getChainByToken: (token: NativeToken | ERC20Token) => Chain | undefined
    getTokenBySymbolAndBlockchainName: (symbol: TokenOptions, blockchainName: string) => NativeToken | ERC20Token
    getTokenByTokenAddress: (tokenAddress: string) => NativeToken | ERC20Token | undefined
    getTokenByIdentifier: (tokenIdentifier: string) => NativeToken | ERC20Token | undefined
    getNativeToken: (chain: Chain) => NativeToken
    getMetamaskParam: (chainId: ChainIds) => {
      chainId: string
      chainName: string
      nativeCurrency: {
        name: string
        symbol: string
        decimals: number
      }
      rpcUrls: readonly string[]
    }
    getFilecoin: () => {
      network: Chain
      token: NativeToken | ERC20Token
    }
  }
}

const app: App = {
  name: 'FilPass',
  companyName: 'FilPass',
  emailConfig: {
    domain: '@company-host.ai',
    fromName: 'FilPass Support',
    supportAddress: 'platform-name@company.com',
    logoUrl: 'https://s3.us-east-2.amazonaws.com/coinemissary.com/filpass-logo.png',
  },
  twitterUrl: 'https://twitter.com',
  linkedinUrl: 'https://www.linkedin.com',
  youtubeChannelUrl: 'https://www.youtube.com',
}

export const AppConfig = {
  app,
  network: {
    fiatPaymentUnit: 'USD',
    chains,
    getChain,
    getChainByName,
    getMetamaskParam,
    getChainByToken,
    getTokenBySymbolAndBlockchainName,
    getTokenByTokenAddress,
    getNativeToken,
    getTokenByIdentifier,
    getFilecoin,
  },
} as const satisfies AppConfig

export type ChainIds = (typeof chains)[number]['chainId']
function getChain(chainId: ChainIds) {
  const index = chains.findIndex(chain => chain.chainId === chainId)
  return chains[index]
}

export type ChainNames = (typeof chains)[number]['name']
function getChainByName(blockchainName: ChainNames) {
  const index = chains.findIndex(chain => chain.name === blockchainName)
  return chains[index]
}

function getMetamaskParam(chainId: ChainIds) {
  const index = chains.findIndex(chain => chain.chainId === chainId)
  const chain = chains[index]
  const tokens = chain.tokens
  const nativeToken = tokens.filter(isERC20Token).at(0) as NativeToken

  return {
    chainId: chains[index].chainId,
    chainName: chains[index].networkName,
    nativeCurrency: {
      name: nativeToken.symbol,
      symbol: nativeToken.symbol,
      decimals: nativeToken.decimals,
    },
    rpcUrls: chains[index].rpcUrls,
  }
}

// export type TokenOptions = (typeof chains)[number]['tokens']
//if token is an ERC20 token, find the chain that has the same erc20TokenAddress in the token array, otherwise uses symbol to find the chain
function getChainByToken(token: NativeToken | ERC20Token) {
  if (isERC20Token(token)) {
    for (const chain of chains) {
      for (const chainToken of chain.tokens) {
        if (isERC20Token(chainToken) && chainToken.erc20TokenAddress === token.erc20TokenAddress) {
          return chain
        }
      }
    }
  }
  for (const chain of chains) {
    for (const chainToken of chain.tokens) {
      if (!isERC20Token(chainToken) && chainToken.symbol === token.symbol) {
        return chain
      }
    }
  }
}

export type TokenOptions = (typeof chains)[number]['tokens'][number]['symbol']
function getTokenBySymbolAndBlockchainName(symbol: TokenOptions, blockchainName: string) {
  const chain = getChainByName(blockchainName as ChainNames)
  const tokens = chain.tokens
  const index = tokens.findIndex(token => token.symbol === symbol)
  return tokens[index]
}

function getTokenByTokenAddress(tokenAddress: string) {
  for (const chain of chains) {
    for (const chainToken of chain.tokens) {
      if (isERC20Token(chainToken) && chainToken.erc20TokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
        return chainToken
      }
    }
  }
}

function getTokenByIdentifier(tokenIdentifier: string) {
  if (tokenIdentifier.length === 42) {
    return getTokenByTokenAddress(tokenIdentifier)
  } else {
    return getChain(tokenIdentifier as ChainIds).tokens[0]
  }
}

function getNativeToken(chain: Chain) {
  const tokens = chain.tokens
  const index = tokens.findIndex(token => !isERC20Token(token))
  return tokens[index]
}

function getFilecoin() {
  const network = getChainByName('Filecoin')

  const tokenName = process.env.IS_DEV ? 'tFIL' : 'FIL'

  const token = network.tokens.find(token => token.symbol === tokenName) as NativeToken

  return {
    network,
    token,
  }
}

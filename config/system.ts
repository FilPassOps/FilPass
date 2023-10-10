import chains, { Chain, Chains, FilecoinChain } from './chains'

export interface App {
  name: string
  companyName: string
  emailConfig: {
    domain: string
    fromName: string
    supportAddress: string
  }
  enableCoinMarketApi: boolean
}

export interface AppConfig {
  app: App
  network: {
    fiatPaymentUnit: string
    chains: Chains
    getChain: (chainId: ChainIds) => Chain
    getChainByName: (blockchainName: ChainNames) => Chain
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
    isFilecoin: (chain: Chain) => chain is FilecoinChain
    hasFilecoinChain: () => boolean
  }
}

const app: App = {
  name: 'Emissary',
  companyName: 'Protocol Labs',
  emailConfig: {
    domain: '@protocol.ai',
    fromName: 'Emissary Support',
    supportAddress: 'emissary@protocol.ai',
  },
  enableCoinMarketApi: true,
}

export const AppConfig = {
  app,
  network: {
    fiatPaymentUnit: 'USD',
    chains,
    getChain,
    getChainByName,
    getMetamaskParam,
    isFilecoin,
    hasFilecoinChain,
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

function isFilecoin(chain: Chain): chain is FilecoinChain {
  return (chain as FilecoinChain).coinType !== undefined
}

function hasFilecoinChain() {
  return chains.some(chain => isFilecoin(chain))
}

function getMetamaskParam(chainId: ChainIds) {
  const index = chains.findIndex(chain => chain.chainId === chainId)
  return {
    chainId: chains[index].chainId,
    chainName: chains[index].networkName,
    nativeCurrency: {
      name: chains[index].symbol,
      symbol: chains[index].symbol,
      decimals: 18,
    },
    rpcUrls: chains[index].rpcUrls,
  }
}

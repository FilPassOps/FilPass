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

const ethereum = {
  name: 'Ethereum',
  networkName: 'Sepolia',
  symbol: 'ETH',
  chainId: '0xaa36a7',
  coinMarketApiCode: 1027, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=MATIC
  units: {
    0: {
      name: 'ETH',
      scale: 0,
    },
    '-9': {
      name: 'GWEI',
      scale: -9,
    },
    '-18': {
      name: 'WEI',
      scale: -18,
    },
  },
  rpcUrls: ['https://ethereum-sepolia.blockpi.network/v1/rpc/public'],
  blockExplorer: { name: 'Etherscan', url: 'https://sepolia.etherscan.io/tx' },
  contractAddress: '0xA6B0F90E96Ff8E6b79D859E2067afFA190AE8dB5',
  iconFileName: 'ethereum-icon.svg',
} as const satisfies Chain

const polygon = {
  name: 'Polygon',
  networkName: 'Mumbai',
  symbol: 'MATIC',
  chainId: '0x13881',
  coinMarketApiCode: 3890, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=MATIC
  units: {
    0: {
      name: 'MATIC',
      scale: 0,
    },
    '-9': {
      name: 'GWEI',
      scale: -9,
    },
    '-18': {
      name: 'WEI',
      scale: -18,
    },
  },
  rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
  blockExplorer: { name: 'Polygonscan', url: 'https://mumbai.polygonscan.com/tx' },
  contractAddress: '0xb63704b534583Eca727d78dde6cCe438171846dc',
  iconFileName: 'polygon-icon.svg',
} as const satisfies Chain

const calibration = {
  name: 'Filecoin',
  networkName: 'Calibration',
  symbol: 'FIL',
  chainId: '0x4cb2f',
  coinMarketApiCode: 2280, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=FIL
  units: {
    0: {
      name: 'FIL',
      scale: 0,
    },
    '-9': {
      name: 'NANOFIL',
      scale: -9,
    },
    '-18': {
      name: 'ATTOFIL',
      scale: -18,
    },
  },
  rpcUrls: ['https://api.calibration.node.glif.io'],
  blockExplorer: { name: 'Filfox', url: 'https://calibration.filfox.info/en/message' },
  contractAddress: '0xbEF649DB6b4e1b2Ac044492433Bccca4287BE90F',
  iconFileName: 'filecoin-icon.svg',
  coinType: 't',
} as const satisfies FilecoinChain

const chains = [ethereum, polygon, calibration] as const satisfies Chains

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

export type Chains = ReadonlyArray<Chain | FilecoinChain>

export interface Chain {
  name: string
  networkName: string
  symbol: string
  chainId: string
  coinMarketApiCode?: number
  units: {
    [key: string]: {
      name: string
      scale: number
    }
  }
  rpcUrls: readonly string[]
  blockExplorer: {
    name: string
    url: string
  }
  contractAddress: string
  iconFileName: string
}

export interface FilecoinChain extends Chain {
  coinType: 'f' | 't'
}

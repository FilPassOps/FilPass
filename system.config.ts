export const COMPANY_NAME = 'Protocol Labs'
export const PLATFORM_NAME = 'Emissary'

export const EMAIL_DOMAIN = '@protocol.ai'
export const EMAIL_FROM_NAME = 'Emissary Support'
export const SUPPORT_EMAIL = 'emissary@protocol.ai'

export interface Chain {
  name: string
  networkName: string
  symbol: string
  chainId: string
  coinMarketApiCode: number
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

type Config = {
  fiatPaymentUnit: string
  chains: ReadonlyArray<Chain | FilecoinChain>
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

const filecoinCalibration = {
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

export const CONFIG = { fiatPaymentUnit: 'USD', chains: [ethereum, polygon, filecoinCalibration] } as const satisfies Config

export const isFilecoinEnabled = CONFIG.chains.some(chain => chain.name === 'Filecoin')

export type ChainIds = (typeof CONFIG.chains)[number]['chainId']
export const getChain = (chainId: ChainIds) => {
  const index = CONFIG.chains.findIndex(chain => chain.chainId === chainId)
  return CONFIG.chains[index]
}

export type ChainNames = (typeof CONFIG.chains)[number]['name']
export const getChainByName = (blockchainName: ChainNames) => {
  const index = CONFIG.chains.findIndex(chain => chain.name === blockchainName)
  return CONFIG.chains[index]
}

export const getMetamaskParam = (chainId: ChainIds) => {
  const index = CONFIG.chains.findIndex(chain => chain.chainId === chainId)
  return {
    chainId: CONFIG.chains[index].chainId,
    chainName: CONFIG.chains[index].networkName,
    nativeCurrency: {
      name: CONFIG.chains[index].symbol,
      symbol: CONFIG.chains[index].symbol,
      decimals: 18,
    },
    rpcUrls: CONFIG.chains[index].rpcUrls,
  }
}

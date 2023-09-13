export const COMPANY_NAME = 'Protocol Labs'
export const PLATFORM_NAME = 'Emissary'

export const EMAIL_DOMAIN = '@protocol.ai'
export const EMAIL_FROM_NAME = 'Emissary Support'
export const SUPPORT_EMAIL = 'emissary@protocol.ai'


export const TOKEN = {
  name: 'Polygon',
  symbol: 'MATIC',
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
  paymentUnit: 'USD',
}

export type Chain = {
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
  rpcUrls: string[]
  blockExplorer: {
    name: string
    url: string
  }
  contractAddress: string
}

type Config = {
  fiatPaymentUnit: string
  chains: Chain[]
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
} //as const

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
} //as const

const filecoin = {
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
} //as const

export const CONFIG: Config = { fiatPaymentUnit: 'USD', chains: [ethereum, polygon, filecoin] }

export const isFilecoinEnabled = CONFIG.chains.some(chain => chain.name === 'Filecoin')

export const getChain = (chainId: string) => {
  const index = CONFIG.chains.findIndex(chain => chain.chainId === chainId)
  return CONFIG.chains[index]
}

export const getChainByName = (blockchainName: string) => {
  const index = CONFIG.chains.findIndex(chain => chain.name === blockchainName)
  return CONFIG.chains[index]
}

export const getMetamaskParam = (chainId: string) => {
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

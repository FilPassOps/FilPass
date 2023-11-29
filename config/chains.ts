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

export type Chains = ReadonlyArray<Chain>

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
  contractAddress: '0x9697210C47cFb1460eE60809e7a6CB12c90d4a4e',
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
  contractAddress: '0xcFA76fB70B75573CE7c99Cde40011F2F7C144D22',
  iconFileName: 'polygon-icon.svg',
} as const satisfies Chain

const calibration = {
  name: 'Filecoin',
  networkName: 'Calibration',
  symbol: 'tFIL',
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
  contractAddress: '0x8Ac6cfB4dBc9d164796E77113277F83D4Dfa3616',
  iconFileName: 'filecoin-icon.svg',
} as const satisfies Chain

const chains = [ethereum, polygon, calibration] as const satisfies Chains

export default chains

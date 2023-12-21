export interface Chain {
  name: string
  networkName: string
  chainId: string
  rpcUrls: readonly string[]
  blockExplorer: {
    name: string
    url: string
  }
  contractAddress: string
  iconFileName: string
  tokens: ReadonlyArray<NativeToken | ERC20Token>
}

export interface NativeToken {
  symbol: string
  coinMarketApiCode: number
  decimals: number
  units: {
    [key: string]: {
      name: string
      scale: number
    }
  }
}

export interface ERC20Token extends NativeToken {
  erc20TokenAddress: string
}

export type Chains = ReadonlyArray<Chain>

export function isERC20Token(token: NativeToken | ERC20Token): token is ERC20Token {
  return (token as ERC20Token)?.erc20TokenAddress !== undefined
}

const ethereum = {
  name: 'Ethereum',
  networkName: 'Sepolia',
  chainId: '0xaa36a7',
  rpcUrls: ['https://ethereum-sepolia.blockpi.network/v1/rpc/public'],
  blockExplorer: { name: 'Etherscan', url: 'https://sepolia.etherscan.io/tx' },
  contractAddress: '0xE7080Ce81adEb8d80afC38B01912639a6b0F9247',
  iconFileName: 'ethereum-icon.svg',
  tokens: [
    {
      symbol: 'ETH',
      coinMarketApiCode: 1027, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=MATIC
      decimals: 18,
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
    },
    {
      symbol: 'USDC',
      erc20TokenAddress: '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8',
      coinMarketApiCode: 3408, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=MATIC
      decimals: 6,
      units: {
        0: {
          name: 'USDC',
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
    },
    {
      symbol: 'LINK',
      erc20TokenAddress: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      coinMarketApiCode: 1975, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=MATIC
      decimals: 18,
      units: {
        0: {
          name: 'LINK',
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
    },
  ],
} as const satisfies Chain

const polygon = {
  name: 'Polygon',
  networkName: 'Mumbai',
  chainId: '0x13881',
  rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
  blockExplorer: { name: 'Polygonscan', url: 'https://mumbai.polygonscan.com/tx' },
  contractAddress: '0xcFA76fB70B75573CE7c99Cde40011F2F7C144D22',
  iconFileName: 'polygon-icon.svg',
  tokens: [
    {
      symbol: 'MATIC',
      coinMarketApiCode: 3890, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=MATIC
      decimals: 18,
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
    },
  ],
} as const satisfies Chain

const calibration = {
  name: 'Filecoin',
  networkName: 'Calibration',
  chainId: '0x4cb2f',
  rpcUrls: ['https://api.calibration.node.glif.io'],
  blockExplorer: { name: 'Filfox', url: 'https://calibration.filfox.info/en/message' },
  contractAddress: '0x8Ac6cfB4dBc9d164796E77113277F83D4Dfa3616',
  iconFileName: 'filecoin-icon.svg',
  tokens: [
    {
      symbol: 'FIL',
      coinMarketApiCode: 2280, // from https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=FIL
      decimals: 18,
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
    },
  ],
} as const satisfies Chain

const chains = [ethereum, polygon, calibration] as const satisfies Chains

export default chains

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
  iconFileName: string
}

export interface ERC20Token extends NativeToken {
  erc20TokenAddress: string
}

export type Chains = ReadonlyArray<Chain>

export function isERC20Token(token: NativeToken | ERC20Token): token is ERC20Token {
  return (token as ERC20Token)?.erc20TokenAddress !== undefined
}

const calibration = {
  name: 'Filecoin',
  networkName: 'Calibration',
  chainId: '0x4cb2f',
  rpcUrls: ['https://api.calibration.node.glif.io'],
  blockExplorer: { name: 'Filfox', url: 'http://47.109.105.51/en/message' },
  contractAddress: '0x650413d87484FC2B9c9bC7b24963f7395a69909b',
  iconFileName: 'filecoin-icon.svg',
  tokens: [
    {
      symbol: 'tFIL',
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
      iconFileName: 'filecoin-icon.svg',
    },
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
      iconFileName: 'filecoin-icon.svg',
    },
  ],
} as const satisfies Chain

const chains = [calibration] as const satisfies Chains

export default chains

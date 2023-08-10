const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID
const MAINNET_ID = '0x89' // 137
const TESTNET_ID = '0x13881' // 80001

export const testnet = {
  chain: {
    chainId: TESTNET_ID,
    chainName: 'Mumbai testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://calibration.filfox.info/en'],
  },
  blockExplorerApi: 'https://mumbai.polygonscan.com/',
  coinType: null,
  multiforwarder: '0xbEF649DB6b4e1b2Ac044492433Bccca4287BE90F',
  networkPrefix: null,
}

export const mainnet = {
  chain: {
    chainId: MAINNET_ID,
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon.llamarpc.com'],
    blockExplorerUrls: ['https://filfox.info/en'],
  },
  blockExplorerApi: 'https://polygonscan.com',
  coinType: null,
  multiforwarder: '0x593eD7Fc71F6bE340A993b809086159Fd9407c6a',
  networkPrefix: null,
}

export default CHAIN_ID === TESTNET_ID ? testnet : mainnet

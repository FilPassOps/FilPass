import { CoinType } from '@glif/filecoin-address'

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
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
  },
  blockExplorerApi: 'https://mumbai.polygonscan.com/',
  coinType: CoinType.TEST, // TODO OPEN-SOURCE: should be null
  multiforwarder: '0xb63704b534583Eca727d78dde6cCe438171846dc',
  networkPrefix: 't', // TODO OPEN-SOURCE: should be null
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
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  blockExplorerApi: 'https://polygonscan.com',
  coinType: CoinType.MAIN, // TODO OPEN-SOURCE: should be null
  multiforwarder: '0x593eD7Fc71F6bE340A993b809086159Fd9407c6a',
  networkPrefix: 'f', // TODO OPEN-SOURCE: should be null
}

export default CHAIN_ID === TESTNET_ID ? testnet : mainnet

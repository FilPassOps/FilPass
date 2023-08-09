import { CoinType } from '@glif/filecoin-address'

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID
const FILECOIN_MAINNET_ID = '0x13a' // 314
const FILECOIN_CALIBRATION_ID = '0x4cb2f' // 314159

export const calibration = {
  chain: {
    chainId: FILECOIN_CALIBRATION_ID,
    chainName: 'Filecoin - Calibration testnet',
    nativeCurrency: {
      name: 'tFIL',
      symbol: 'tFIL',
      decimals: 18,
    },
    rpcUrls: ['https://api.calibration.node.glif.io'],
    blockExplorerUrls: ['https://calibration.filfox.info/en'],
  },
  blockExplorerApi: 'https://calibration.filfox.info/api/v1',
  coinType: CoinType.TEST,
  multiforwarder: '0xbEF649DB6b4e1b2Ac044492433Bccca4287BE90F',
  networkPrefix: 't',
}

export const mainnet = {
  chain: {
    chainId: FILECOIN_MAINNET_ID,
    chainName: 'Filecoin - Mainnet',
    nativeCurrency: {
      name: 'FIL',
      symbol: 'FIL',
      decimals: 18,
    },
    rpcUrls: ['https://api.node.glif.io'],
    blockExplorerUrls: ['https://filfox.info/en'],
  },
  blockExplorerApi: 'https://filfox.info/api/v1',
  coinType: CoinType.MAIN,
  multiforwarder: '0x593eD7Fc71F6bE340A993b809086159Fd9407c6a',
  networkPrefix: 'f',
}

export default CHAIN_ID === FILECOIN_CALIBRATION_ID ? calibration : mainnet

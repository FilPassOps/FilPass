import '@nomicfoundation/hardhat-toolbox'
import dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import { HardhatNetworkUserConfig, HttpNetworkUserConfig } from 'hardhat/types'

dotenv.config()

interface Config extends HardhatUserConfig {
  defaultNetwork: keyof Config['networks']
  networks: {
    calibration: HttpNetworkUserConfig
    sepolia: HttpNetworkUserConfig
    mumbai: HttpNetworkUserConfig
    hardhat?: HardhatNetworkUserConfig
  }
}

const config: Config = {
  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {},
    calibration: {
      chainId: 314159,
      url: 'https://api.calibration.node.glif.io/rpc/v1',
    },
    sepolia: {
      chainId: 11155111,
      url: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    },
    mumbai: {
      chainId: 80001,
      url: 'https://rpc-mumbai.maticvigil.com',
    },
  },
  paths: {
    sources: './contracts/src',
    tests: './contracts/test',
  },
}

export default config

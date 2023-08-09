import '@nomicfoundation/hardhat-toolbox'
import dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import { HttpNetworkUserConfig } from 'hardhat/types'

dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY || 'af0b7b857ff6fe0d45a8613ee96e30771e5e7dbdddb778c324b81c980f4f71c7'

interface Config extends HardhatUserConfig {
  defaultNetwork: keyof Config['networks']
  networks: {
    calibration: HttpNetworkUserConfig
    filecoin: HttpNetworkUserConfig
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
  defaultNetwork: 'calibration',
  networks: {
    calibration: {
      chainId: 314159,
      url: 'https://api.calibration.node.glif.io/rpc/v1',
      accounts: [PRIVATE_KEY],
    },
    filecoin: {
      chainId: 314,
      url: 'https://api.node.glif.io',
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    tests: './contracts/test',
  },
}

export default config

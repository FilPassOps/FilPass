import '@nomicfoundation/hardhat-toolbox'
import dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import { HttpNetworkUserConfig } from 'hardhat/types'

dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY || '7c19c76458a0d6faf4fa0735e172568083ef2b86698f0c739dae2c34a1f14ad8'

interface Config extends HardhatUserConfig {
  defaultNetwork: keyof Config['networks']
  networks: {
    mumbai: HttpNetworkUserConfig
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
  defaultNetwork: 'mumbai',
  networks: {
    mumbai: {
      chainId: 80001,
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources: './contracts/src',
    tests: './contracts/test',
  },
}

export default config

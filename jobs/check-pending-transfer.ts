import { AppConfig, Chain } from 'config'
import { ethers } from 'ethers'
import { MultiForwarder, MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'
import { processPendingTransfer } from './utils/process-pending-transfer'

const contractMap = new Map<Chain, MultiForwarder>()

AppConfig.network.chains.forEach(chain => {
  const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])
  const signer = provider.getSigner()
  contractMap.set(chain, MultiForwarderFactory.connect(chain.contractAddress, signer))
})

export default async function run() {
  const promises = []

  for (const [chain, contract] of contractMap.entries()) {
    promises.push(processPendingTransfer(chain, contract))
  }

  await Promise.all(promises)
}

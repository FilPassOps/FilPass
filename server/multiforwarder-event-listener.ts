import { transferPaymentConfirm } from 'domain/transfer/transfers-payment-confirm'
import { ethers } from 'ethers'
import { logger } from 'lib/logger'
import { CONFIG } from 'system.config'
import { MultiForwarder, MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'

const map = new Map<string, MultiForwarder>()

CONFIG.chains.forEach(chain => {
  const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])
  const signer = provider.getSigner()
  map.set(chain.name, MultiForwarderFactory.connect(chain.contractAddress, signer))
})

for (const [chainName, contract] of map.entries()) {
  const filter = contract.filters.Forward()
  contract.on(filter, (id, from, to, value, _total, event) => {
    logger.info('Forward', event.transactionHash)
    transferPaymentConfirm({ chainName, id, from, to, value, transactionHash: event.transactionHash })
  })
}

logger.info('> Listening for events...')

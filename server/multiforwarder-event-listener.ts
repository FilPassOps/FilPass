import config from 'chains.config'
import { transferPaymentConfirm } from 'domain/transfer/transfers-payment-confirm'
import { ethers } from 'ethers'
import { logger } from 'lib/logger'
import { MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'

const provider = new ethers.providers.JsonRpcProvider(config.chain.rpcUrls[0])
const signer = provider.getSigner()
const multiForwarder = MultiForwarderFactory.connect(config.multiforwarder, signer)
const filterAny = multiForwarder.filters.ForwardAny()
const filter = multiForwarder.filters.Forward()

multiForwarder.on(filterAny, (id, from, to, value, _total, event) => {
  logger.info('ForwardAny', event.transactionHash)
  transferPaymentConfirm({ id, from, to, value, transactionHash: event.transactionHash })
})

multiForwarder.on(filter, (id, from, to, value, _total, event) => {
  logger.info('Forward', event.transactionHash)
  transferPaymentConfirm({ id, from, to, value, transactionHash: event.transactionHash })
})

logger.info('> Listening for events...')

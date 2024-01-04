import { AppConfig, ChainNames } from 'config'
import { transferPaymentConfirm } from 'domain/transfer/transfers-payment-confirm'
import { ethers } from 'ethers'
import { logger } from 'lib/logger'
import { MultiForwarder, MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'

const map = new Map<ChainNames, MultiForwarder>()

AppConfig.network.chains.forEach(chain => {
  const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0])
  const signer = provider.getSigner()
  map.set(chain.name, MultiForwarderFactory.connect(chain.contractAddress, signer))
})

for (const [chainName, contract] of map.entries()) {
  logger.info(`> Listening for events on ${chainName}...`)

  const forwardEvent = contract.filters.Forward()
  const forwardERC20 = contract.filters.ForwardERC20()

  contract.on(forwardEvent, (id, from, to, value, _total, event) => {
    logger.info(`${chainName} - Forward: ${event.transactionHash}`)
    const chain = AppConfig.network.getChainByName(chainName)
    const token = AppConfig.network.getNativeToken(chain)

    transferPaymentConfirm({ id, from, to, value, transactionHash: event.transactionHash, tokenDecimal: token.decimals })
  })

  contract.on(forwardERC20, (id, from, to, value, _total, tokenAddress, event) => {
    logger.info(`${chainName} - Forward ERC20: ${event.transactionHash} - Token address: ${tokenAddress}`)
    const token = AppConfig.network.getTokenByTokenAddress(tokenAddress)

    if (!token) {
      logger.error(`Token not found for address ${tokenAddress}`)
      return
    }

    transferPaymentConfirm({ id, from, to, value, transactionHash: event.transactionHash, tokenDecimal: token.decimals })
  })
}
